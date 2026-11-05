import { useState, useEffect } from "react";

// Адрес сервера берётся из настройки VITE_API_URL (на хостинге), локально — localhost
const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

function App() {
  // Токен хранится в браузере, поэтому вход сохраняется после обновления страницы
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [tasks, setTasks] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  // Запрос к серверу с токеном входа
  async function request(path, options = {}) {
    const response = await fetch(API + path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    });
    if (response.status === 401) {
      logout();
      return null;
    }
    return response;
  }

  // Регистрация или вход (mode: "register" или "login")
  async function submitAuth(mode) {
    setAuthError("");
    const response = await fetch(API + "/" + mode, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username, password: password }),
    });
    const data = await response.json();
    if (!response.ok) {
      setAuthError(data.error);
      return;
    }
    if (mode === "register") {
      return submitAuth("login"); // после регистрации сразу входим
    }
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setPassword("");
  }

  function logout() {
    localStorage.removeItem("token");
    setToken("");
    setTasks([]);
  }

  async function loadTasks() {
    const response = await request("/tasks");
    if (!response) return;
    setTasks(await response.json());
  }

  useEffect(() => {
    if (token) loadTasks();
  }, [token]);

  async function addTask() {
    setError("");
    const response = await request("/tasks", {
      method: "POST",
      body: JSON.stringify({ text: text }),
    });
    if (!response) return;
    if (!response.ok) {
      const data = await response.json();
      setError(data.error);
      return;
    }
    setText("");
    loadTasks();
  }

  async function removeTask(id) {
    await request("/tasks/" + id, { method: "DELETE" });
    loadTasks();
  }

  // ---------- Экран входа ----------
  if (!token) {
    return (
      <div className="max-w-sm mx-auto mt-10 p-6 bg-white rounded-xl shadow">
        <h1 className="text-2xl font-bold text-center mb-4">Вход</h1>
        <input
          className="w-full border rounded-lg px-3 py-2 mb-2"
          placeholder="Имя пользователя"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="w-full border rounded-lg px-3 py-2 mb-2"
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {authError && <p className="text-red-600 text-sm mb-2">{authError}</p>}
        <div className="flex gap-2">
          <button
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-800"
            onClick={() => submitAuth("login")}
          >
            Войти
          </button>
          <button
            className="flex-1 border border-blue-600 text-blue-600 py-2 rounded-lg hover:bg-blue-50"
            onClick={() => submitAuth("register")}
          >
            Регистрация
          </button>
        </div>
      </div>
    );
  }

  // ---------- Список задач ----------
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Список дел</h1>
        <button className="text-sm text-gray-500 hover:text-red-600" onClick={logout}>
          Выйти
        </button>
      </div>

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
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

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
