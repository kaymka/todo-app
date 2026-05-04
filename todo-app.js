(function() {

    // Константа с базовым URL сервера
    const API_URL = 'https://todo-api-qq25.onrender.com';

    //создаем и возвращаем заголовок приложения
    function createAppTitle(title) {
        //будем передавать заголовок в аргументе ф-ции,чтобы мы могли его изменить
        //создаем переменную
        let appTitle = document.createElement('h2');
        //присваиваем внутреннему содержимому title, который передаем в качестве аргумента
        appTitle.innerHTML = title;
        return appTitle; //возвращенные ф-цией элементы будем помещать внутрь дива
    }

    //создаеи и возвращаем форму для создания дела
    function createTodoItemForm() {
        let form = document.createElement('form'); //создаем элемент формы
        let input = document.createElement('input'); //создаем поле для ввода
        let buttonWrapper = document.createElement('div'); //созд эл-т для правильной стилизации
        let button = document.createElement('button'); //созд кнопку

        //расставим различные атрибуты нашим элементам
        form.classList.add('input-group', 'mb-3');
        input.classList.add('form-control');
        input.placeholder = 'Введите название нового дела';
        buttonWrapper.classList.add('input-group-append');
        button.classList.add('btn', 'btn-primary');
        button.textContent = 'Добавить дело';

        //объединяем DOM-эл-ты в едину. структуру
        buttonWrapper.append(button);
        form.append(input);
        form.append(buttonWrapper);

        //возвращаем, чтобюы иметь к ним доступ
        return {
            form,
            input,
            button
        };
    }

    //создаем и возвращаем список элементов
    function createTodoList() {
        let list = document.createElement('ul');
        list.classList.add('list-group');
        return list;
    }

    //фунция создания DOM-эл-т с делом    
    function createTodoItemElements(todoItem, { onDone, onDelete }) { //создаст эл-т для списка дел и вернет все необходимое для взаимодействия с этим элементом
        const doneClass = 'list-group-item-success';

        let item = document.createElement('li');
        //создаем группу кнопок, которые помещаем в элемент, который красиво покажет их в одной группе
        let buttonGroup = document.createElement('div');
        let doneButton = document.createElement('button');
        let deleteButton = document.createElement('button');

        //устанавливаем стили для эл-та списка, а также для размещения кнопок в его правой части с помощью flex
        item.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
        if (todoItem.done) {
            item.classList.add(doneClass);
        }
        item.textContent = todoItem.name;

        buttonGroup.classList.add('btn-group', 'btn-group-sm');
        doneButton.classList.add('btn', 'btn-success');
        doneButton.textContent = 'Готово';
        deleteButton.classList.add('btn', 'btn-danger');
        deleteButton.textContent = 'Удалить';

        //добавляем обработчики на кнопки
        doneButton.addEventListener('click', async function() {
            onDone({ todoItem, element: item });
            item.classList.toggle(doneClass, todoItem.done); //toggle добавляет или убирает класс (который меняет цвет на зеленый)
        });
        deleteButton.addEventListener('click', function() {
            onDelete({ todoItem, element: item });
        });

        //вкладываем кнопки в группу кнопок
        buttonGroup.append(doneButton);
        buttonGroup.append(deleteButton);
        item.append(buttonGroup);

        return item;
    }

    async function createTodoApp(container, title, owner) {
        //вызываем ф-ции
        let todoAppTitle = createAppTitle(title);
        let todoItemForm = createTodoItemForm();
        let todoList = createTodoList();
        
        const handlers = {
            onDone: async function({ todoItem, element }) {
                // Правильно инвертируем значение
                todoItem.done = !todoItem.done;

                // Ждем ответ от сервера 
                await fetch(`${API_URL}/todos/${todoItem.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ done: todoItem.done }),
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
            },
            onDelete({ todoItem, element }) {
                if (!confirm('Вы уверены?')) {
                    return;
                }
                element.remove();
                fetch(`${API_URL}/todos/${todoItem.id}`, {
                    method: 'DELETE',
                });
            },
        };

        //размещаем их результат внутри контеинера
        container.append(todoAppTitle);
        container.append(todoItemForm.form); // возвращаем не сам объект, а свойство form
        container.append(todoList);

        //Отправляем запрос на список всех дел
        const response = await fetch(`${API_URL}/todos?owner=${owner}`);
        const todoItemList = await response.json();

        todoItemList.forEach(todoItem => {
            const todoItemElement = createTodoItemElements(todoItem, handlers);
            todoList.append(todoItemElement);
        });

        //браузер создает событие submit на форме по нажатию на enter или на кнопку создания дела
        todoItemForm.form.addEventListener('submit', async function(e) {
            //эта строчка необходима. чтобы предотвратить стандартное действие браузера
            //в данном случае мы не хотим, чтобы страница перезагружалась при отправке формы
            e.preventDefault();

            //Игнорируем создание эл-та, если пользователь ничего не ввел в поле
            if (!todoItemForm.input.value) {
                return;
            }

            const response = await fetch(`${API_URL}/todos`, {
                method: 'POST',
                body: JSON.stringify({
                    name: todoItemForm.input.value.trim(),
                    owner,
                }),
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            const todoItem = await response.json();

            //помещаем в переменную результат выполнения функции
            let todoItemElement = createTodoItemElements(todoItem, handlers);

            //добавляем эл-т в список
            todoList.append(todoItemElement);

            //обнуляем значение в поле, чтобы не пришлось стирать его вручную
            todoItemForm.input.value = '';
        });
    }

    //явно регистрируем функцию createTodoApp в глобальном объекте window, чтобы получить доступ к этой функции из других скриптов
    window.createTodoApp = createTodoApp;

})();
