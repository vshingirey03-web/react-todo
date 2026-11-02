import { useState } from "react";

function App() {
  const [tasks, setTasks] = useState([]);
  const [text, setText] = useState("");

  function addTask() {
    if (text === "") return;
    setTasks([...tasks, text]);
    setText("");
  }

  function removeTask(index) {
    setTasks(tasks.filter((task, i) => i !== index));
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
        {tasks.map((task, index) => (
          <li
            key={index}
            className="flex justify-between py-2 border-b"
          >
            {task}
            <button onClick={() => removeTask(index)}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
