/* eslint-disable react/prop-types */
import { useEffect, useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { SocketIOProvider } from 'y-socket.io';
import { MonacoBinding } from 'y-monaco';

export default function CodeEditor({ roomId, language }) {
  const [editor, setEditor] = useState(null);
  const providerRef = useRef(null);
  const docRef = useRef(null);
  const bindingRef = useRef(null);

  // Handle Editor Mount
  function handleEditorDidMount(editorInstance) {
    setEditor(editorInstance);
  }

  // Visualization of cursors - optional css
  // .yRemoteSelection { background-color: ... }
  // .yRemoteSelectionHead { ... }

  useEffect(() => {
    if (!editor || !roomId) return;

    // 1. Create Yjs document
    const doc = new Y.Doc();
    docRef.current = doc;

    // 2. Connect to provider (WebSocket/Socket.io)
    // We point to the local server URL. Vite proxy handles /socket.io but 
    // y-socket.io client might need full URL if not consistent.
    // However, SocketIOProvider usually takes a url string.
    const provider = new SocketIOProvider(
      window.location.origin, // Connect to the same origin
      roomId,
      doc,
      {
        autoConnect: true,
      }
    );
    providerRef.current = provider;

    // 3. Bind Yjs text to Monaco
    const type = doc.getText('monaco');

    // Create binding
    const binding = new MonacoBinding(
      type,
      editor.getModel(),
      new Set([editor]),
      provider.awareness
    );
    bindingRef.current = binding;

    // Cleanup
    return () => {
      if (provider) {
        provider.disconnect();
        provider.destroy();
      }
      if (doc) {
        doc.destroy();
      }
      if (binding) {
        binding.destroy();
      }
    };
  }, [editor, roomId]);

  return (
    <Editor
      height="calc(100vh - 64px)"
      theme="vs-dark"
      language={language}
      defaultValue="// Start coding..."
      onMount={handleEditorDidMount}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        automaticLayout: true,
      }}
    />
  );
}
