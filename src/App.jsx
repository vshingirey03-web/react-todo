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

  // Состояние меню «⋯», редактирования и добавления подпункта
  const [menuId, setMenuId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [subFor, setSubFor] = useState(null);
  const [subText, setSubText] = useState("");

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

  // Общая отправка изменения; ошибку сервера показываем на экране
  async function send(path, options) {
    setError("");
    const response = await request(path, options);
    if (!response) return false;
    if (!response.ok) {
      const data = await response.json();
      setError(data.error);
      return false;
    }
    await loadTasks();
    return true;
  }

  async function addTask() {
    const ok = await send("/tasks", { method: "POST", body: JSON.stringify({ text: text }) });
    if (ok) setText("");
  }

  async function addSubtask(parentId) {
    const ok = await send("/tasks", {
      method: "POST",
      body: JSON.stringify({ text: subText, parent_id: parentId }),
    });
    if (ok) {
      setSubFor(null);
      setSubText("");
    }
  }

  async function toggleDone(task) {
    setMenuId(null);
    await send("/tasks/" + task.id, { method: "PATCH", body: JSON.stringify({ done: !task.done }) });
  }

  async function saveEdit(task) {
    const ok = await send("/tasks/" + task.id, { method: "PATCH", body: JSON.stringify({ text: editText }) });
    if (ok) setEditId(null);
  }

  async function removeTask(task) {
    setMenuId(null);
    if (childrenOf(task.id).length > 0 && !window.confirm("Удалить задачу вместе с подпунктами?")) {
      return;
    }
    await send("/tasks/" + task.id, { method: "DELETE" });
  }

  const topTasks = tasks.filter((t) => t.parent_id === null);
  function childrenOf(id) {
    return tasks.filter((t) => t.parent_id === id);
  }

  // ---------- Один пункт списка (и подпункт) ----------
  function renderItem(task, number, isSub) {
    const kids = childrenOf(task.id);
    const doneKids = kids.filter((k) => k.done).length;

    return (
      <li key={task.id}>
        <div className="flex items-center gap-2 py-2 border-b">
          <input
            type="checkbox"
            className="h-4 w-4 shrink-0"
            checked={task.done}
            onChange={() => toggleDone(task)}
          />
          <span className="text-gray-400 text-sm w-9 shrink-0">{number}</span>

          {editId === task.id ? (
            <>
              <input
                autoFocus
                className="flex-1 min-w-0 border rounded px-2 py-1"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit(task);
                  if (e.key === "Escape") setEditId(null);
                }}
              />
              <button className="text-green-600 px-1" onClick={() => saveEdit(task)}>✓</button>
              <button className="text-gray-500 px-1" onClick={() => setEditId(null)}>✕</button>
            </>
          ) : (
            <span className={"flex-1 min-w-0 break-words " + (task.done ? "line-through text-gray-400" : "")}>
              {task.text}
              {kids.length > 0 && (
                <span className="ml-2 text-xs text-gray-400">
                  {doneKids}/{kids.length}
                </span>
              )}
            </span>
          )}

          <div className="relative shrink-0">
            <button
              className="px-2 text-gray-500 hover:text-black"
              onClick={() => setMenuId(menuId === task.id ? null : task.id)}
            >
              ⋯
            </button>
            {menuId === task.id && (
              <div className="absolute right-0 z-20 mt-1 w-52 bg-white border rounded-lg shadow text-sm">
                <button
                  className="block w-full text-left px-3 py-2 hover:bg-gray-100"
                  onClick={() => {
                    setEditId(task.id);
                    setEditText(task.text);
                    setMenuId(null);
                  }}
                >
                  Редактировать
                </button>
                {!isSub && (
                  <button
                    className="block w-full text-left px-3 py-2 hover:bg-gray-100"
                    onClick={() => {
                      setSubFor(task.id);
                      setSubText("");
                      setMenuId(null);
                    }}
                  >
                    Добавить подпункт
                  </button>
                )}
                <button
                  className="block w-full text-left px-3 py-2 hover:bg-gray-100"
                  onClick={() => toggleDone(task)}
                >
                  {task.done ? "Снять отметку" : "Отметить выполненным"}
                </button>
                <button
                  className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-50"
                  onClick={() => removeTask(task)}
                >
                  Удалить
                </button>
              </div>
            )}
          </div>
        </div>

        {subFor === task.id && (
          <div className="flex gap-2 ml-8 py-2">
            <input
              autoFocus
              className="flex-1 min-w-0 border rounded px-2 py-1"
              placeholder="Новый подпункт"
              value={subText}
              onChange={(e) => setSubText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addSubtask(task.id);
                if (e.key === "Escape") setSubFor(null);
              }}
            />
            <button className="bg-blue-600 text-white px-3 rounded hover:bg-blue-800" onClick={() => addSubtask(task.id)}>
              Добавить
            </button>
            <button className="text-gray-500 px-1" onClick={() => setSubFor(null)}>✕</button>
          </div>
        )}

        {kids.length > 0 && (
          <ul className="ml-8">
            {kids.map((k, j) => renderItem(k, number + "." + (j + 1), true))}
          </ul>
        )}
      </li>
    );
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
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded-xl shadow">
      {/* Прозрачная подложка: клик мимо меню закрывает его */}
      {menuId !== null && <div className="fixed inset-0 z-10" onClick={() => setMenuId(null)} />}

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Список дел</h1>
        <button className="text-sm text-gray-500 hover:text-red-600" onClick={logout}>
          Выйти
        </button>
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-2"
          placeholder="Новая задача"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addTask();
          }}
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
        {topTasks.map((task, i) => renderItem(task, String(i + 1), false))}
      </ul>
    </div>
  );
}

export default App;
