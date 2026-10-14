import { useEffect, useRef } from 'react';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, indentOnInput } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import * as Y from 'yjs';
import { FireProvider } from 'y-fire';
import { yCollab } from 'y-codemirror.next';
import { app } from '../firebase';
import { useTheme } from '../hooks/useTheme';
import { getRandomCollaborator } from '../utils/collaboratorColors';

const darkTheme = oneDark;
const lightTheme = syntaxHighlighting(defaultHighlightStyle, { fallback: true });

function languageExtension(language) {
    switch (language) {
        case 'javascript':
            return javascript();
        case 'typescript':
            return javascript({ typescript: true });
        case 'python':
            return python();
        case 'html':
            return html();
        case 'css':
            return css();
        case 'java':
            return java();
        case 'cpp':
            return cpp();
        default:
            return []; // Plain text
    }
}

export default function CodeEditor({
    roomId,
    language,
    canEdit,
    editorRef,
    fontSize = 14,
    lineWrapping = true,
    user = null,
    onCollaboratorsChange = null,
    onCursorChange = null,
    onCodeChange = null,
    onRun = null
}) {
    const [isDark] = useTheme();
    const containerRef = useRef(null);
    const viewRef = useRef(null);
    const providerRef = useRef(null);
    const docRef = useRef(null);
    const ytextRef = useRef(null);
    const onRunRef = useRef(onRun);
    onRunRef.current = onRun;

    // Compartments for dynamic reconfiguration without recreating the editor
    const languageComp = useRef(new Compartment());
    const themeComp = useRef(new Compartment());
    const editableComp = useRef(new Compartment());
    const fontSizeComp = useRef(new Compartment());
    const lineWrappingComp = useRef(new Compartment());

    // Build the editor + Yjs / Firebase collaboration once per room
    useEffect(() => {
        if (!containerRef.current || !roomId) return;

        // 1. Yjs document + shared text
        const doc = new Y.Doc();
        docRef.current = doc;
        const ytext = doc.getText('codemirror');
        ytextRef.current = ytext;

        // 2. Firebase provider (Firestore-backed)
        let provider;
        try {
            provider = new FireProvider({
                firebaseApp: app,
                path: `rooms/${roomId}`,
                ydoc: doc,
                maxUpdatesThreshold: 1,
                maxWaitTime: 10,
                maxWaitFirestoreTime: 500,
            });
            providerRef.current = provider;

            // Configure local user identity in awareness
            const localUser = getRandomCollaborator(user);
            provider.awareness.setLocalStateField('user', localUser);

            // Listen to awareness changes to report active collaborators
            const updateCollaborators = () => {
                if (!onCollaboratorsChange) return;
                const states = Array.from(provider.awareness.getStates().values());
                const users = states
                    .map(s => s.user)
                    .filter(Boolean);
                onCollaboratorsChange(users);
            };

            provider.awareness.on('change', updateCollaborators);
            updateCollaborators();
        } catch (err) {
            console.error('Failed to initialize Firebase provider:', err);
        }

        // 3. Custom run keymap (Ctrl-Enter / Cmd-Enter)
        const runKeymap = keymap.of([
            {
                key: 'Mod-Enter',
                run: () => {
                    if (onRunRef.current) {
                        onRunRef.current();
                        return true;
                    }
                    return false;
                }
            }
        ]);

        // 4. Editor update listener for cursor coordinates & word/line stats
        const updateListener = EditorView.updateListener.of((update) => {
            if (update.selectionSet || update.docChanged) {
                const state = update.state;
                const mainSel = state.selection.main;
                const line = state.doc.lineAt(mainSel.head);
                const col = mainSel.head - line.from + 1;
                const selected = mainSel.empty ? 0 : Math.abs(mainSel.to - mainSel.from);

                const text = state.doc.toString();
                const lines = state.doc.lines;
                const chars = text.length;
                const words = text.trim() ? text.trim().split(/\s+/).length : 0;

                if (onCursorChange) {
                    onCursorChange({
                        cursorPos: { line: line.number, col },
                        stats: { lines, chars, words, selected }
                    });
                }

                if (update.docChanged && onCodeChange) {
                    onCodeChange(text);
                }
            }
        });

        // 5. Initial Editor state
        const state = EditorState.create({
            doc: ytext.toString(),
            extensions: [
                lineNumbers(),
                highlightActiveLine(),
                history(),
                indentOnInput(),
                keymap.of([...defaultKeymap, ...historyKeymap]),
                runKeymap,
                updateListener,
                languageComp.current.of(languageExtension(language)),
                themeComp.current.of(isDark ? darkTheme : lightTheme),
                editableComp.current.of(EditorView.editable.of(canEdit)),
                fontSizeComp.current.of(EditorView.theme({ '&': { fontSize: `${fontSize}px` } })),
                lineWrappingComp.current.of(lineWrapping ? EditorView.lineWrapping : []),
                provider ? yCollab(ytext, provider.awareness) : [],
            ],
        });

        const view = new EditorView({ state, parent: containerRef.current });
        viewRef.current = view;

        // Expose helper methods to parent
        if (editorRef) {
            editorRef.current = {
                getValue: () => view.state.doc.toString(),
                setValue: (newVal) => {
                    if (!canEdit) return;
                    view.dispatch({
                        changes: { from: 0, to: view.state.doc.length, insert: newVal }
                    });
                },
                insertTemplate: (tpl) => {
                    if (!canEdit) return;
                    view.dispatch({
                        changes: { from: 0, to: view.state.doc.length, insert: tpl }
                    });
                },
                focus: () => view.focus()
            };
        }

        // Observe Yjs text changes (both local and remote syncs)
        const ytextObserver = () => {
            if (onCodeChange) {
                onCodeChange(ytext.toString());
            }
        };
        ytext.observe(ytextObserver);

        // Trigger initial stats
        if (onCodeChange) {
            onCodeChange(ytext.toString());
        }

        return () => {
            ytext.unobserve(ytextObserver);
            view.destroy();
            viewRef.current = null;
            if (providerRef.current) providerRef.current.destroy();
            if (docRef.current) docRef.current.destroy();
            if (editorRef) editorRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]);

    // Update user identity in awareness when user changes
    useEffect(() => {
        if (providerRef.current?.awareness) {
            const localUser = getRandomCollaborator(user);
            providerRef.current.awareness.setLocalStateField('user', localUser);
        }
    }, [user]);

    // React to language changes
    useEffect(() => {
        if (!viewRef.current) return;
        viewRef.current.dispatch({
            effects: languageComp.current.reconfigure(languageExtension(language)),
        });
    }, [language]);

    // React to theme changes
    useEffect(() => {
        if (!viewRef.current) return;
        viewRef.current.dispatch({
            effects: themeComp.current.reconfigure(isDark ? darkTheme : lightTheme),
        });
    }, [isDark]);

    // React to edit-permission changes
    useEffect(() => {
        if (!viewRef.current) return;
        viewRef.current.dispatch({
            effects: editableComp.current.reconfigure(EditorView.editable.of(canEdit)),
        });
    }, [canEdit]);

    // React to font size changes
    useEffect(() => {
        if (!viewRef.current) return;
        viewRef.current.dispatch({
            effects: fontSizeComp.current.reconfigure(EditorView.theme({ '&': { fontSize: `${fontSize}px` } })),
        });
    }, [fontSize]);

    // React to line wrapping changes
    useEffect(() => {
        if (!viewRef.current) return;
        viewRef.current.dispatch({
            effects: lineWrappingComp.current.reconfigure(lineWrapping ? EditorView.lineWrapping : []),
        });
    }, [lineWrapping]);

    return (
        <div
            ref={containerRef}
            className="h-full w-full overflow-auto text-sm cm-mobile-editor font-mono"
        />
    );
}
