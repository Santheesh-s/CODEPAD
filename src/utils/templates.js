// Starter templates for supported languages
export const TEMPLATES = {
    javascript: `// JavaScript Starter Template
function fibonacci(n) {
  const sequence = [0, 1];
  for (let i = 2; i < n; i++) {
    sequence.push(sequence[i - 1] + sequence[i - 2]);
  }
  return sequence;
}

console.log("Welcome to Codeplaces!");
console.log("Fibonacci numbers (first 10):", fibonacci(10));

const users = [
  { name: "Alice", role: "Developer" },
  { name: "Bob", role: "Designer" },
  { name: "Charlie", role: "DevOps" }
];

console.log("Team members:");
users.forEach(u => console.log(\` - \${u.name} (\${u.role})\`));
`,

    typescript: `// TypeScript Starter Template
interface Task {
  id: number;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

class TaskManager {
  private tasks: Task[] = [];

  addTask(title: string, priority: 'low' | 'medium' | 'high' = 'medium'): Task {
    const task: Task = {
      id: this.tasks.length + 1,
      title,
      completed: false,
      priority
    };
    this.tasks.push(task);
    return task;
  }

  listTasks(): void {
    console.log("=== Active Tasks ===");
    this.tasks.forEach(t => {
      const status = t.completed ? "✓" : "○";
      console.log(\`[\${status}] #\${t.id}: \${t.title} (\${t.priority} priority)\`);
    });
  }
}

const manager = new TaskManager();
manager.addTask("Collaborate on Codeplaces", "high");
manager.addTask("Test real-time editor", "medium");
manager.addTask("Ship awesome project", "high");
manager.listTasks();
`,

    python: `# Python Starter Template
import math

def calculate_stats(numbers):
    total = sum(numbers)
    mean = total / len(numbers)
    variance = sum((x - mean) ** 2 for x in numbers) / len(numbers)
    std_dev = math.sqrt(variance)
    return {
        "count": len(numbers),
        "mean": round(mean, 2),
        "std_dev": round(std_dev, 2),
        "min": min(numbers),
        "max": max(numbers)
    }

data = [12, 45, 67, 89, 34, 22, 90, 56, 78]
stats = calculate_stats(data)

print("Python execution successful!")
print("Statistics for dataset:", data)
for key, value in stats.items():
    print(f"  {key.capitalize()}: {value}")
`,

    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Live Preview</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 2rem;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 80vh;
      box-sizing: border-box;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      padding: 2rem;
      border-radius: 1rem;
      max-width: 480px;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    h1 {
      margin-top: 0;
      background: linear-gradient(135deg, #38bdf8, #818cf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      font-weight: 600;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    button:hover {
      background: #2563eb;
      transform: translateY(-2px);
    }
    #counter {
      font-size: 2.5rem;
      font-weight: bold;
      color: #38bdf8;
      margin: 1rem 0;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>🚀 Interactive Live Preview</h1>
    <p>Edit this HTML/CSS/JS and see updates in real-time!</p>
    <div id="counter">0</div>
    <button onclick="increment()">Click Me!</button>
  </div>

  <script>
    let count = 0;
    function increment() {
      count++;
      document.getElementById('counter').innerText = count;
      console.log("Button clicked! Current count:", count);
    }
  </script>
</body>
</html>
`,

    css: `/* Modern CSS Reset & Card Styling */
:root {
  --primary-color: #3b82f6;
  --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
  --surface: rgba(255, 255, 255, 0.05);
  --border: rgba(255, 255, 255, 0.1);
  --text: #f8fafc;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, sans-serif;
  background: var(--bg-gradient);
  color: var(--text);
  min-height: 100vh;
  display: grid;
  place-items: center;
}

.glass-card {
  background: var(--surface);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease;
}

.glass-card:hover {
  transform: translateY(-4px);
}
`,

    cpp: `// C++ Starter Template
#include <iostream>
#include <vector>
#include <numeric>
#include <algorithm>

int main() {
    std::cout << "Hello from C++ in Codeplaces!" << std::endl;
    
    std::vector<int> numbers = {5, 12, 7, 24, 3, 19, 8};
    
    std::sort(numbers.begin(), numbers.end());
    
    std::cout << "Sorted numbers: ";
    for (int num : numbers) {
        std::cout << num << " ";
    }
    std::cout << std::endl;
    
    int sum = std::accumulate(numbers.begin(), numbers.end(), 0);
    std::cout << "Total Sum: " << sum << std::endl;
    std::cout << "Average: " << static_cast<double>(sum) / numbers.size() << std::endl;
    
    return 0;
}
`,

    java: `// Java Starter Template
import java.util.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java in Codeplaces!");
        
        List<String> fruits = new ArrayList<>(Arrays.asList("Apple", "Banana", "Cherry", "Date", "Elderberry"));
        
        System.out.println("Original list: " + fruits);
        
        Collections.reverse(fruits);
        System.out.println("Reversed list: " + fruits);
        
        int totalChars = fruits.stream().mapToInt(String::length).sum();
        System.out.println("Total characters in all fruits: " + totalChars);
    }
}
`,

    text: `Welcome to Codeplaces!
===================================
A real-time collaborative workspace.

Features:
- Live synchronization via Firebase Firestore & CRDT
- Multi-language code editor (JS, TS, Python, HTML, CSS, C++, Java)
- Real-time cursor presence & collaborator badges
- Instant code execution & HTML/JS live preview
- Teacher Mode: lock editing for focused instruction
- Export & download your code with a single click

Press Ctrl+Enter (Cmd+Enter on Mac) to run your code!
`
};

export const FILE_EXTENSIONS = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    html: 'html',
    css: 'css',
    cpp: 'cpp',
    java: 'java',
    text: 'txt'
};
