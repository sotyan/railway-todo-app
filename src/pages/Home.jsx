import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { Header } from "../components/Header";
import { url } from "../const";
import "./home.scss";

export const Home = () => {
  const [isDoneDisplay, setIsDoneDisplay] = useState("todo"); // todo->未完了 done->完了
  const [lists, setLists] = useState([]);
  const [selectListId, setSelectListId] = useState();
  const [tasks, setTasks] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [cookies] = useCookies();
  const handleIsDoneDisplayChange = (e) => setIsDoneDisplay(e.target.value);
  useEffect(() => {
    axios
      .get(`${url}/lists`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setLists(res.data);
      })
      .catch((err) => {
        setErrorMessage(`リストの取得に失敗しました。${err}`);
      });
  }, []);

  useEffect(() => {
    const listId = lists[0]?.id;
    if (typeof listId !== "undefined") {
      setSelectListId(listId);
      axios
        .get(`${url}/lists/${listId}/tasks`, {
          headers: {
            authorization: `Bearer ${cookies.token}`,
          },
        })
        .then((res) => {
          setTasks(res.data.tasks);
        })
        .catch((err) => {
          setErrorMessage(`タスクの取得に失敗しました。${err}`);
        });
    }
  }, [lists]);

  const handleSelectList = (id) => {
    setSelectListId(id);
    axios
      .get(`${url}/lists/${id}/tasks`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setTasks(res.data.tasks);
      })
      .catch((err) => {
        setErrorMessage(`タスクの取得に失敗しました。${err}`);
      });
  };
  const pressEnter = (event, id) => {
    if (event.key === "Enter") {
      handleSelectList(id);
    }
  };
  return (
    <div>
      <Header />
      <main className="taskList">
        <p className="error-message">{errorMessage}</p>
        <div>
          <div className="list-header">
            <h2 className="home-h">リスト一覧</h2>
            <div className="list-menu">
              <p>
                <Link to="/list/new">リスト新規作成</Link>
              </p>
              <p>
                <Link to={`/lists/${selectListId}/edit`}>
                  選択中のリストを編集
                </Link>
              </p>
            </div>
          </div>
          <ul className="list-tab" role="tablist">
            {lists.map((list, key) => {
              const isActive = list.id === selectListId;
              return (
                <li
                  key={key}
                  className={`list-tab-item ${isActive ? "active" : ""}`}
                  onClick={() => handleSelectList(list.id)}
                  role="tab"
                  tabIndex={2}
                  onKeyDown={(event) => pressEnter(event, list.id)}
                >
                  {list.title}
                </li>
              );
            })}
          </ul>
          <div className="tasks">
            <div className="tasks-header">
              <h2 className="home-h">タスク一覧</h2>
              <Link to="/task/new">タスク新規作成</Link>
            </div>
            <div className="display-select-wrapper">
              <select
                onChange={handleIsDoneDisplayChange}
                className="display-select"
              >
                <option value="todo">未完了</option>
                <option value="done">完了</option>
              </select>
            </div>
            <Tasks
              tasks={tasks}
              selectListId={selectListId}
              isDoneDisplay={isDoneDisplay}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

// 表示するタスク
const Tasks = (props) => {
  const { tasks, selectListId, isDoneDisplay } = props;
  if (tasks === null) return <></>;

  if (isDoneDisplay == "done") {
    // 完了
    return (
      <ul>
        {tasks
          .filter((task) => {
            return task.done === true;
          })
          .map((task, key) => (
            <li key={key} className="task-item">
              <Link
                to={`/lists/${selectListId}/tasks/${task.id}`}
                className="task-item-link"
              >
                {task.title}
                <br />
                {task.done ? "完了" : "未完了"}
                <br />
                <Limit limit={task.limit} complete={task.done} />
              </Link>
            </li>
          ))}
      </ul>
    );
  }

  return (
    // 未完了
    <ul>
      {tasks
        .filter((task) => {
          return task.done === false;
        })
        .map((task, key) => (
          <li key={key} className="task-item">
            <Link
              to={`/lists/${selectListId}/tasks/${task.id}`}
              className="task-item-link"
            >
              {task.title}
              <br />
              {task.done ? "完了" : "未完了"}
              <br />
              <Limit limit={task.limit} />
            </Link>
          </li>
        ))}
    </ul>
  );
};

var minus9Hours = (limit) => {
  // 9時間ずれる問題を解消
  limit = new Date(limit);
  limit.setHours(limit.getHours() - 9);
  return limit;
};
const formatShowLimit = (limit) => {
  const year = String(limit.getFullYear()).padStart(4, "0");
  const month = String(limit.getMonth() + 1).padStart(2, "0");
  const day = String(limit.getDate()).padStart(2, "0");
  const hours = String(limit.getHours()).padStart(2, "0");
  const minutes = String(limit.getMinutes()).padStart(2, "0");
  return (
    year + "年" + month + "月" + day + "日 " + hours + "時" + minutes + "分"
  );
};
const formatShowRestLimit = (limit) => {
  const nowTime = new Date();
  const restLimit = limit - nowTime;
  if (restLimit <= 0) return "期限切れ";
  const day = String(Math.floor(restLimit / (3600000 * 24))).padStart(2, "0");
  const hours = String(
    Math.floor((restLimit % (3600000 * 24)) / 3600000),
  ).padStart(2, "0");
  const minutes = String(
    Math.floor(((restLimit % (3600000 * 24)) % 3600000) / 60000),
  ).padStart(2, "0");
  return day + "日" + hours + "時間" + minutes + "分";
};
const Limit = (props) => {
  const limit = minus9Hours(props.limit);
  const showLimit = formatShowLimit(limit);
  var showRestLimit;
  (props.complete) ? showRestLimit = "完了済み" : showRestLimit = formatShowRestLimit(limit);
  return (
    <div className="limit">
      期限日時：{showLimit}
      <br />
      残り日時：{showRestLimit}
    </div>
  );
};
