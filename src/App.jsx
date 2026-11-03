import { useState, useEffect } from "react";

const API = "http://localhost:3000/tasks";

function App() {
  const [tasks, setTasks] = useState([]);
  const [text, setText] = useState("");

  async function loadTasks() {
    const response = await fetch(API);
    const data = await response.json();
    setTasks(data);
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function addTask() {
    if (text === "") return;
    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text }),
    });
    setText("");
    loadTasks();
  }

  async function removeTask(id) {
    await fetch(API + "/" + id, { method: "DELETE" });
    loadTasks();
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold text-center mb-4">Список дел</h1>

      <div className="flex gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-800"
          onClick={addTask}
        >
          Добавить
        </button>
      </div>

      <ul className="mt-4">
        {tasks.map((task) => (
          <li key={task.id} className="flex justify-between py-2 border-b">
            {task.text}
            <button onClick={() => removeTask(task.id)}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;