const store = (initVal) => {
  const store = Redux.createStore((state = initVal, action) => {
    if (action.type === "update") return action.value;
    return state;
  });
  return (...args) => {
    if (args.length === 0) {
      if (CurrentComponentSubs !== null) CurrentComponentSubs.add(store);
      return store.getState();
    }
    store.dispatch({ type: "update", value: args[0] });
  };
};

let CurrentComponentSubs = null;
const component = (Component) => {
  return (props) => {
    const { current: subs } = React.useRef(new Map());
    const prevCompSubs = CurrentComponentSubs;
    CurrentComponentSubs = new Set();
    const [_, update] = React.useState();
    const render = Component(props);
    CurrentComponentSubs.forEach((store) => {
      if (!subs.has(store))
        subs.set(
          store,
          store.subscribe(() => update({}))
        );
    });
    subs.forEach((unsub, store) => {
      if (!CurrentComponentSubs.has(store)) unsub();
    });
    CurrentComponentSubs = prevCompSubs;
    return render;
  };
};

const AppState = {
  theme: store("dark"),
  lang: store("en"),
  currentUser: store({
    newBoardName: store(""),
    boards: store([
      {
        id: Math.random(),
        name: store("board 1"),
        newTaskText: store(""),
        tasks: store([{
          id: Math.random(),
          text: store(`task 0`),
          completed: store(false),
          edit: store(false),
          newText: store("")
        }])
      }
    ])
  })
};


let h = React.createElement;

const App = component(() => {
  const addBoard = () => {
    AppState.currentUser().boards([
      ...AppState.currentUser().boards(),
      {
        id: Math.random(),
        name: store(AppState.currentUser().newBoardName()),
        tasks: store([]),
        newTaskText: store("")
      }
    ]);
    AppState.currentUser().newBoardName("");
  };
  return (
    h("div", null,
      h("input", {
        value: AppState.currentUser().newBoardName(),
        onChange: (e) => AppState.currentUser().newBoardName(e.target.value)
      }),
      h("button", { onClick: addBoard }, "add board"),
      h("div", null,
        h("h1", null, "boards"),
        h("div", null,
          AppState.currentUser()
            .boards()
            .map((board) => (
              h(Board, { key: board.id, board: board })
            ))
        )
      )
    )
  );
});

const Board = component(({ board }) => {
  const deleteBoard = () => {
    AppState.currentUser.boards(
      AppState.currentUser.boards().filter((it) => it !== board)
    );
  };

  const addTask = () => {
    board.tasks([
      ...board.tasks(),
      {
        id: Math.random(),
        board: store(board),
        text: store(board.newTaskText()),
        completed: store(false),
        edit: store(true),
        newText: store("")
      }
    ]);
  };


  return (
    h("div", { style: { padding: 10, margin: 10, border: "1px solid gray" } },
      h("div", { style: { display: "flex" } },
        h("div", null, board.name()),
        h("button", { style: { marginLeft: "auto" }, onClick: deleteBoard }, "delete board"),
        h("button", { style: { marginLeft: 10 }, onClick: addTask }, "add task"),
        h("button", {
          onClick: () => {
            let newTasks = [];
            for (let i = 0; i < 1000; i += 1) {
              newTasks.push({
                id: Math.random(),
                text: store(`task ${i}`),
                completed: store(false),
                edit: store(false),
                newText: store("")
              })
            }
            board.tasks([...board.tasks(), ...newTasks]);
          }
        }, "add 1000 tasks"),
      ),
      h("div", { style: { paddingLeft: 20, paddingRight: 20 } },
        h("div", null,
          board.tasks().map((task) => (
            h(Task, { key: task.id, task: task, board: board })
          )))
      )
    )
  )
});




const Task = component(({ task, board }) => {
  return (
    h("div", { style: { padding: 10, margin: 10, border: "1px solid gray" } },
      h("div", { style: { display: "flex" } },
        h("input", {
          style: { marginRight: 10 },
          type: "checkbox",
          onChange: () => task.completed(!task.completed)
        }),
        task.edit() ? (
          h("div", null,
            h("input", {
              value: task.newText(),
              onChange: (e) => task.newText(e.target.value)
            }),
            h("div", null,
              h("button", {
                onClick: () => {
                  task.newText("");
                  task.edit(false);
                }
              }, "cancel"),
              h("button", {
                onClick: () => {
                  task.text(task.newText());
                  task.edit(false);
                }
              }, "save")
            )
          )
        ) : (
          h("div", null, task.text())
        ),
        h("button", {
          style: { marginLeft: "auto" },
          onClick: () => {
            task.edit(true);
            task.newText(task.text());
          }
        }, "edit"),
        h("button", {
          style: { marginLeft: 10 },
          onClick: () => {
            board.tasks(board.tasks().filter((it) => it !== task));
          }
        }, "delete")
      )
    )
  );
});



const rootElement = document.getElementById("root");
ReactDOM.render(h(React.StrictMode, null, h(App)), rootElement);