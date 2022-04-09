App.Modules.Sites.StoragesPage = class extends Colibri.UI.Component {

    constructor(name, container) {
        super(name, container, Colibri.UI.Templates['App.Modules.Sites.StoragesPage']);

        this.AddClass('app-sites-storages-page-component');

        this._storages = this.Children('storages-pane/storages');

        this._storages.AddHandler('ContextMenuIconClicked', (event, args) => this.__renderStoragesContextMenu(event, args))
        this._storages.AddHandler('ContextMenuItemClicked', (event, args) => this.__clickOnStoragesContextMenu(event, args));


    }

    _canAddFieldAsChild(field) {
        return field.type === 'json';
    }

    _findModuleNode(fieldNode) {
        let f = fieldNode;
        while (f && f.tag.type && f.tag.type != 'module') {
            f = f.parentNode;
        }
        return f;
    }

    _findStorageNode(fieldNode) {
        let f = fieldNode;
        while (f && f.tag.type && f.tag.type != 'storage') {
            f = f.parentNode;
        }
        return f;
    }

    __renderStoragesContextMenu(event, args) {

        let contextmenu = [];

        const node = args.item;
        const tag = node.tag;
        const nodeType = tag.type;
        switch (nodeType) {
            case 'module':
                contextmenu.push({ name: 'new-storage', title: 'Новое хранилище', icon: Colibri.UI.ContextMenuAddIcon });
                break;
            case 'storage':
                contextmenu.push({ name: 'edit-storage', title: 'Редактировать свойства хранилища', icon: Colibri.UI.ContextMenuEditIcon });
                contextmenu.push({ name: 'remove-storage', title: 'Удалить хранилище', icon: Colibri.UI.ContextMenuRemoveIcon });
                contextmenu.push({ name: 'new-field', title: 'Новое свойство', icon: Colibri.UI.ContextMenuAddIcon });
                contextmenu.push({ name: 'new-index', title: 'Новый индекс', icon: Colibri.UI.ContextMenuAddIcon });
                break;
            case 'fields':
                contextmenu.push({ name: 'new-field', title: 'Новое свойство', icon: Colibri.UI.ContextMenuAddIcon });
                break;
            case 'field':
                contextmenu.push({ name: 'edit-field', title: 'Редактировать свойство', icon: Colibri.UI.ContextMenuEditIcon });
                contextmenu.push({ name: 'remove-field', title: 'Удалить свойство', icon: Colibri.UI.ContextMenuRemoveIcon });
                if (this._canAddFieldAsChild(tag.entry)) {
                    contextmenu.push({ name: 'new-field', title: 'Новое свойство', icon: Colibri.UI.ContextMenuAddIcon });
                }
                break;
            case 'indices':
                contextmenu.push({ name: 'new-index', title: 'Новый индекс', icon: Colibri.UI.ContextMenuAddIcon });
                break;
            case 'index':
                contextmenu.push({ name: 'edit-index', title: 'Редактировать индекс', icon: Colibri.UI.ContextMenuEditIcon });
                contextmenu.push({ name: 'remove-index', title: 'Удалить индекс', icon: Colibri.UI.ContextMenuRemoveIcon });
                break;
        }

        node.contextmenu = contextmenu;
        node.ShowContextMenu(args.isContextMenuEvent ? 'right bottom' : 'left bottom', '', args.isContextMenuEvent ? { left: args.domEvent.clientX, top: args.domEvent.clientY } : null);

    }

    _storageFields() {
        return {
            name: 'Storage',
            desc: 'Хранилища',
            fields: {
                name: {
                    type: 'varchar',
                    component: 'Text',
                    desc: 'Наименование хранилища',
                    note: 'Пожалуйста, введите наименование. Внимание! должно содержать только латинские буквы и цифры без тире, дефисов и пробелов',
                    required: true,
                    params: {
                        validate: [{
                            message: 'Пожалуйста, введите наименование хранилища',
                            method: '(field, validator) => !!field.value'
                        }, {
                            message: 'Введенный текст не соответствует требованиям',
                            method: '(field, validator) => !/[^\\w\\d]/.test(field.value)'
                        }]
                    }
                },
                desc: {
                    type: 'varchar',
                    component: 'Text',
                    desc: 'Описание',
                    note: 'Описание, в свободной форме',
                    required: true,
                    params: {
                        validate: [{
                            message: 'Пожалуйста, введите описание хранилища',
                            method: '(field, validator) => !!field.value'
                        }]
                    }
                },
                'access-point': {
                    type: 'varchar',
                    component: 'Select',
                    desc: 'Подключение',
                    note: 'Внинание! Предполагается, что вы знаете, что делаете!',
                    lookup: () => {
                        return new Promise((rs, rj) => {
                            Manage.Store.AsyncQuery('manage.datapoints').then((points) => {
                                rs({ result: Object.keys(points).map(k => { return { value: k, title: k }; }) });
                            });
                        });
                    },
                    params: {
                        validate: [{
                            message: 'Пожалуйста, выберите подключение',
                            method: '(field, validator) => !!field.value'
                        }]
                    }
                },
                models: {
                    type: 'json',
                    component: 'Object',
                    desc: 'Модели',
                    note: 'Название классов моделей. Внимание! Неймспейс должен начинаться с Models\\',
                    fields: {
                        table: {
                            type: 'varchar',
                            desc: 'Таблица',
                            component: 'Text'
                        },
                        row: {
                            type: 'varchar',
                            component: 'Text',
                            desc: 'Строка'
                        }
                    },
                    params: {
                        validate: [{
                            message: 'Пожалуйста, введите наименование классов моделей таблицы и строки',
                            method: '(field, validator) => !!field.value.table && !!field.value.row'
                        }]
                    }
                },
                params: {
                    type: 'json',
                    component: 'Object',
                    desc: 'Дополнительные параметры',
                    vertical: true,
                    fields: {
                        visible: {
                            type: 'bool',
                            placeholder: 'Отображать в менеджере хранилищ',
                            component: 'Checkbox',
                            default: true
                        },
                        maybepublished: {
                            type: 'bool',
                            placeholder: 'Данные могут быть опубликованы',
                            component: 'Checkbox',
                            default: true
                        }
                    }
                }
            }
        };
    }

    _fieldFields() {
        /**
         * 
        desc: Отцовская страница
        type: bigint unsigned
        class: App\Modules\Sites\Models\Page
        component: Hidden
        default: '0'
        required: true
        readonly: false
        lookup:
            storage: pages
            title: description
            value: id
         */
        return {
            name: 'Field',
            desc: 'Свойство',
            fields: {
                name: {
                    type: 'varchar',
                    component: 'Text',
                    desc: 'Наименование свойства',
                    note: 'Пожалуйста, введите наименование. Внимание! должно содержать только латинские буквы и цифры без тире, дефисов и пробелов',
                    required: true,
                    params: {
                        validate: [{
                            message: 'Пожалуйста, введите наименование свойства',
                            method: '(field, validator) => !!field.value'
                        }, {
                            message: 'Введенный текст не соответствует требованиям',
                            method: '(field, validator) => !/[^\\w\\d]/.test(field.value)'
                        }]
                    }
                },
                desc: {
                    type: 'varchar',
                    component: 'Text',
                    desc: 'Описание свойства',
                    note: 'Можно на русском языке. Внимание! Описание должно полностью описывать свойство, учитывайте, что модель будет возвращать модель указанную в поле Класс.',
                    required: true,
                    params: {
                        validate: [{
                            message: 'Пожалуйста, опишите свойство',
                            method: '(field, validator) => !!field.value'
                        }]
                    }
                },
                type: {
                    type: 'varchar',
                    component: 'Text',
                    desc: 'Тип свойства (для хранения в источнике данных)',
                    note: 'Внинание! Предполагается, что вы знаете, что делаете!',
                    required: true,
                    params: {
                        validate: [{
                            message: 'Пожалуйста, введите тип свойства',
                            method: '(field, validator) => !!field.value'
                        }]
                    }
                },
                component: {
                    type: 'varchar',
                    component: 'Select',
                    desc: 'Компонента',
                    note: 'Выберите компоненту, которая будет использоваться в формах для ввода и редактирования данных',
                    selector: {
                        __render: (itemData) => '<div style="display: flex; align-items: center;">' + (itemData.icon ?? '<svg width="28" height="28"></svg>') + '<span style="display: block; margin-left: 10px;">' + itemData.title + '</span></div>'
                    },
                    lookup: () => {
                        return new Promise((rs, rj) => {
                            Manage.Store.AsyncQuery('manage.modules').then((modules) => {
                                let components = [];

                                for (const module of modules) {
                                    try {
                                        const moduleComponents = eval('Object.keys(App.Modules.' + module.name + '.UI)');
                                        for (const name of moduleComponents) {
                                            if (eval('App.Modules.' + module.name + '.' + name + '.prototype instanceof Colibri.UI.Forms.Field')) {
                                                components.push({ value: 'App.Modules.' + module.name + '.UI.' + name, title: name, icon: Colibri.UI.FieldIcons['App.Modules.' + module.name + '.UI.' + name] });
                                            }
                                        }
                                    }
                                    catch (e) { }
                                }

                                try {
                                    const manageComponents = Object.keys(App.Modules.Manage.UI);
                                    for (const name of manageComponents) {
                                        if (eval('App.Modules.Manage.UI.' + name + '.prototype instanceof Colibri.UI.Forms.Field')) {
                                            components.push({ value: 'App.Modules.Manage.UI.' + name, title: name, icon: Colibri.UI.FieldIcons['App.Modules.Manage.UI.' + name] });
                                        }
                                    }
                                }
                                catch (e) { }

                                const standartComponents = Object.keys(Colibri.UI.Forms);
                                for (const name of standartComponents) {
                                    if (['Field', 'Form'].indexOf(name) === -1) {
                                        components.push({ value: 'Colibri.UI.Forms.' + name, title: name, icon: Colibri.UI.FieldIcons[name] });
                                    }
                                }

                                rs({ result: components });
                            });
                        });
                    },
                    params: {
                        validate: [{
                            message: 'Пожалуйста, выберите подключение',
                            method: '(field, validator) => !!field.value'
                        }]
                    }
                },
                required: {
                    type: 'bool',
                    placeholder: 'Обязательное поле',
                    component: 'Checkbox',
                    default: true
                },
                readonly: {
                    type: 'bool',
                    placeholder: 'Только для чтения',
                    component: 'Checkbox',
                    default: true
                },
                default: {
                    type: 'varchar',
                    component: 'TextArea',
                    desc: 'Значение по умолчанию',
                    note: 'Введите значение по умолчанию. Внимание! Предполагается что вы знаете что делаете',
                },
                lookup: {
                    type: 'json',
                    component: 'Object',
                    desc: 'Связка',
                    note: 'Связь с другими хранилищами',
                    fields: {
                        storage: {
                            type: 'varchar',
                            desc: 'Хранилище',
                            component: 'Select',
                            selector: {
                                value: 'name',
                                title: 'desc'
                            },
                            lookup: () => {
                                return new Promise((rs, rj) => {
                                    Manage.Store.AsyncQuery('manage.storages').then((storages) => {
                                        rs({ result: Object.values(storages).filter((s => s.params.visible)) });
                                    });
                                });
                            },
                        },
                        title: {
                            type: 'varchar',
                            component: 'Text',
                            desc: 'Поле для вывода'
                        },
                        value: {
                            type: 'varchar',
                            component: 'Text',
                            desc: 'Поле для значения'
                        }
                    },
                    params: {
                        validate: [{
                            message: 'Пожалуйста, введите наименование классов моделей таблицы и строки',
                            method: '(field, validator) => !!field.value.table && !!field.value.row'
                        }]
                    }
                },
                values: {
                    type: 'json',
                    component: 'Array',
                    desc: 'Значения',
                    default: [],
                    params: {
                        addlink: 'Добавить значение'
                    },
                    fields: {
                        title: {
                            type: 'varchar',
                            component: 'Text',
                            desc: 'Поле для вывода'
                        },
                        value: {
                            type: 'varchar',
                            component: 'Text',
                            desc: 'Поле для значения'
                        }
                    }
                }
            }
        };
    }

    _fieldIndex(storageName) {
        /**
         * 
        pubs_pagestoragerow_idx:
            fields:
            - page
            - storage
            - row
            type: NORMAL
            method: BTREE
         */
        return {
            name: 'Field',
            desc: 'Свойство',
            fields: {
                name: {
                    type: 'varchar',
                    component: 'Text',
                    desc: 'Наименование индекса',
                    note: 'Внимание! Рекомендуется индекс называть следующим образом: storage_fields_idx, где storage название хранилища fields - список полей через _',
                    required: true,
                    params: {
                        validate: [{
                            message: 'Пожалуйста, введите наименование свойства',
                            method: '(field, validator) => !!field.value'
                        }, {
                            message: 'Введенный текст не соответствует требованиям',
                            method: '(field, validator) => !/[^\\w\\d]/.test(field.value)'
                        }]
                    }
                },
                desc: {
                    type: 'varchar',
                    component: 'Select',
                    multiple: true,
                    desc: 'Спосок свойств',
                    note: 'Выберите список свойств по которым необходимо индексировать',
                    required: true,
                    lookup: () => {
                        return new Promise((rs, rj) => {
                            Manage.Store.AsyncQuery('manage.storages(' + storageName + ')').then((storage) => {
                                const components = [];
                                Object.forEach(storage.fields, (name, field) => {
                                    if(['json'].indexOf(field.type)) {
                                        components.push({ value: name, title: field.desc + ' (' + name + ')' });
                                    }
                                });
                                rs({ result: components });
                            });
                        });
                    },
                    params: {
                        validate: [{
                            message: 'Пожалуйста, выберите свойства',
                            method: '(field, validator) => !!field.value'
                        }]
                    }
                },
                type: {
                    type: 'varchar',
                    component: 'Select',
                    desc: 'Тип индекса',
                    note: 'Внинание! Предполагается, что вы знаете, что делаете!',
                    required: true,
                    default: 'NORMAL',
                    values: [
                        {value: 'FULLTEXT', title: 'Полнотекстовый'},
                        {value: 'NORMAL', title: 'Нормальный'},
                        {value: 'SPATIAL', title: 'Пространственный'},
                        {value: 'UNIQUE', title: 'Уникальный'},
                    ]
                },
                method: {
                    type: 'varchar',
                    component: 'Select',
                    desc: 'Компонента',
                    note: 'Выберите компоненту, которая будет использоваться в формах для ввода и редактирования данных',
                    default: 'BREE',
                    values: [
                        {value: 'BREE', title: 'Бинарное дерево'},
                        {value: 'HASH', title: 'Хэш функция'},
                    ],
                    params: {
                        validate: [{
                            message: 'Пожалуйста, выберите подключение',
                            method: '(field, validator) => !!field.value'
                        }]
                    }
                }
            }
        };
    }

    __clickOnStoragesContextMenu(event, args) {

        const node = this._storages.selected;
        if (!node) {
            return false;
        }

        const menuData = args.menuData;
        if (!menuData) {
            return false;
        }

        if (menuData.name == 'new-storage') {
            const moduleNode = this._findModuleNode(node);
            if (Security.IsCommandAllowed('sites.storages.add')) {
                Manage.FormWindow.Show('Новое хранилище', 800, this._storageFields(), {})
                    .then((data) => {
                        Sites.SaveStorage(moduleNode.tag.entry, data);
                    })
                    .catch(() => { });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }
        }
        else if (menuData.name == 'edit-storage') {
            const moduleNode = this._findModuleNode(node);
            if (Security.IsCommandAllowed('sites.storages.edit')) {
                Manage.FormWindow.Show('Редактировать хранилище', 800, this._storageFields(), node.tag.entry)
                    .then((data) => {
                        Sites.SaveStorage(moduleNode.tag.entry, data);
                    })
                    .catch(() => { });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }

        }
        else if (menuData.name == 'remove-storage') {
            const moduleNode = this._findModuleNode(node);
            App.Confirm.Show('Удаление хранилища данных', 'Вы уверены, что хотите удалить хранилище данных?', 'Удалить!').then(() => {
                Sites.DeleteStorage(moduleNode.tag.entry, node.tag.entry);
            });
        }
        else if (menuData.name == 'new-field') {
            const moduleNode = this._findModuleNode(node);
            const storageNode = this._findStorageNode(node);
            if (Security.IsCommandAllowed('sites.storages.' + storageNode.tag.entry.name + '.fields')) {
                Manage.FormWindow.Show('Новое свойство', 800, this._fieldFields(), {})
                    .then((data) => {
                        Sites.SaveField(moduleNode.tag.entry, storageNode.tag.entry, data);
                    })
                    .catch(() => { });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }
        }
        else if (menuData.name == 'edit-field') {
            const moduleNode = this._findModuleNode(node);
            const storageNode = this._findStorageNode(node);
            if (Security.IsCommandAllowed('sites.storages.' + storageNode.tag.entry.name + '.fields')) {
                Manage.FormWindow.Show('Редактировать свойство', 800, this._fieldFields(), node.tag.entry)
                    .then((data) => {
                        Sites.SaveField(moduleNode.tag.entry, storageNode.tag.entry, data);
                    })
                    .catch(() => { });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }

        }
        else if (menuData.name == 'remove-field') {
            const moduleNode = this._findModuleNode(node);
            const storageNode = this._findStorageNode(node);
            if (Security.IsCommandAllowed('sites.storages.' + storageNode.tag.entry.name + '.fields')) {
                App.Confirm.Show('Удаление свойства', 'Вы уверены, что хотите удалить свойство?', 'Удалить!').then(() => {
                    Sites.DeleteField(moduleNode.tag.entry, storageNode.tag.entry, node.tag.entry);
                });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }

        }
        else if (menuData.name == 'new-index') {
            const moduleNode = this._findModuleNode(node);
            const storageNode = this._findStorageNode(node);
            if (Security.IsCommandAllowed('sites.storages.' + storageNode.tag.entry.name + '.indexes')) {
                Manage.FormWindow.Show('Новый индекс', 800, this._fieldIndex(storageNode.tag.entry.name), {})
                    .then((data) => {
                        Sites.SaveIndex(moduleNode.tag.entry, storageNode.tag.entry, data);
                    })
                    .catch(() => { });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }
        }
        else if (menuData.name == 'edit-index') {
            const moduleNode = this._findModuleNode(node);
            const storageNode = this._findStorageNode(node);
            if (Security.IsCommandAllowed('sites.storages.' + storageNode.tag.entry.name + '.indexes')) {
                Manage.FormWindow.Show('Редактировать индекс', 800, this._fieldIndex(storageNode.tag.entry.name), node.tag.entry)
                    .then((data) => {
                        Sites.SaveIndex(moduleNode.tag.entry, storageNode.tag.entry, data);
                    })
                    .catch(() => { });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }

        }
        else if (menuData.name == 'remove-index') {
            const moduleNode = this._findModuleNode(node);
            const storageNode = this._findStorageNode(node);
            if (Security.IsCommandAllowed('sites.storages.' + storageNode.tag.entry.name + '.fields')) {
                App.Confirm.Show('Удаление индекса', 'Вы уверены, что хотите удалить индекс?', 'Удалить!').then(() => {
                    Sites.DeleteIndex(moduleNode.tag.entry, storageNode.tag.entry, node.tag.entry);
                });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }

        }
    }

    __renderPublicationsContextMenu(event, args) {
        let contextmenu = [];

        contextmenu.push({ name: 'edit-data', title: 'Редактировать данные публикации', icon: Colibri.UI.ContextMenuEditIcon });
        contextmenu.push({ name: 'remove-pub', title: 'Удалить публикацию', icon: Colibri.UI.ContextMenuRemoveIcon });

        args.item.contextmenu = contextmenu;
        args.item.ShowContextMenu(args.isContextMenuEvent ? 'right bottom' : 'left bottom', '', args.isContextMenuEvent ? { left: args.domEvent.clientX, top: args.domEvent.clientY } : null);

    }

    __clickOnPublicationsContextMenu(event, args) {

        const item = args?.item;
        const menuData = args.menuData;
        if (!menuData) {
            return false;
        }

        if (menuData.name == 'edit-data') {
            this._editData.Dispatch('Clicked');
        }
        else if (menuData.name == 'remove-pub') {
            this._deleteData.Dispatch('Clicked');
        }
    }

    __foldersDoubleClick(event, args) {
        const item = this._folders.selected;
        if (!item) {
            if (Security.IsCommandAllowed('sites.structure.add')) {
                Manage.FormWindow.Show('Новый раздел', 1024, 'app.manage.storages(pages)', {})
                    .then((data) => {
                        Sites.SaveFolder(data);
                    })
                    .catch(() => { });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }
        }
        else {
            if (Security.IsCommandAllowed('sites.structure.edit')) {
                Manage.FormWindow.Show('Редактировать раздел', 1024, 'app.manage.storages(pages)', node.tag.entry)
                    .then((data) => {
                        data.parent = node.tag.entry?.parent?.id ?? 0;
                        Sites.SaveFolder(data);
                    })
                    .catch(() => { });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }
        }
    }

    __dragDropComplete(event, args) {

        const dragged = args.dragged;
        const droppedTo = args.droppedTo;

        if (dragged instanceof Colibri.UI.TreeNode && droppedTo instanceof Colibri.UI.TreeNode) {
            // Перетаскивание нодов
            const folderMoving = dragged.tag;
            const folderTo = droppedTo.tag;
            Sites.MoveFolder(folderMoving, folderTo);
        }
        else if (dragged instanceof Colibri.UI.Grid.Row && droppedTo instanceof Colibri.UI.TreeNode) {
            // копирование публикации
            const pub = dragged.value;
            const folderTo = droppedTo.tag;
            Sites.CopyPublication(pub, folderTo);
        }


    }

    _loadPublicationsPage(folder, searchTerm, page) {
        this._publicationsCurrentPage = page;
        Sites.LoadPublications(folder, searchTerm, page, 20);
    }

    __searchInputFilled(event, args) {
        const selected = this._folders.selected;
        this._loadPublicationsPage(selected?.tag, this._searchInput.value, 1);
    }

    __publicationsScrolledToBottom(event, args) {
        const selected = this._folders.selected;
        this._loadPublicationsPage(selected?.tag, this._searchInput.value, this._publicationsCurrentPage + 1);
    }

    __selectionChangedOnFolder(event, args) {

        const selected = this._folders.selected;

        this._searchInput.enabled = selected != null;
        this._publications.enabled = selected != null;
        this._publishButton.enabled = selected != null;
        this._addData.enabled = selected != null;
        this._editData.enabled = false;
        this._deleteData.enabled = false;
        this._publications.UnselectAllRows();
        this._publications.UncheckAllRows();

        this.__searchInputFilled(event, args);

    }

    __selectionChangedOnPublication(event, args) {
        const checked = this._publications.checked;
        const selected = this._publications.selected;
        this._editData.enabled = checked.length == 1 || !!selected;
        this._deleteData.enabled = checked.length > 0 || !!selected;
    }

    __checkChangedOnPublications(event, args) {
        const checked = this._publications.checked;
        const selected = this._publications.selected;
        this._editData.enabled = checked.length == 1 || !!selected;
        this._deleteData.enabled = checked.length > 0 || !!selected;
    }

    __deleteDataButtonClicked(event, args) {
        if (this._publications.checked.length == 0) {
            App.Confirm.Show('Удаление публикации', 'Вы уверены, что хотите удалить выбранную публикацию?', 'Удалить!').then(() => {
                Sites.DeletePublication([this._publications.selected.value.id]);
            });
        }
        else {
            App.Confirm.Show('Удаление публикации', 'Вы уверены, что хотите удалить выбранные публикации?', 'Удалить!').then(() => {
                let ids = [];
                this._publications.checked.forEach((row) => {
                    ids.push(row.value.id);
                });
                Sites.DeletePublication(ids);
            });
        }
    }

    __addDataButtonClicked(event, args) {

        Manage.Store.AsyncQuery('manage.storages').then((storages) => {

            const contextmenu = [];
            Object.forEach(storages, (name, storage) => {
                if (storage.params.visible && storage.params.maybepublished) {
                    contextmenu.push({ name: storage.name, title: storage.desc, icon: App.Modules.Sites.Icons.ContextMenuStorageIcon });
                }
            });

            const contextMenuObject = new Colibri.UI.ContextMenu('storages-list', document.body, 'right top');
            contextMenuObject.Show(contextmenu, this._addData);
            contextMenuObject.AddHandler('Clicked', (event, args) => {
                contextMenuObject.Hide();
                const menuData = args.menuData;
                if (Security.IsCommandAllowed('sites.storages.' + menuData.name + '.edit')) {
                    Manage.FormWindow.Show('Новая строка «' + menuData.title + '»', 1024, 'app.manage.storages(' + menuData.name + ')', {})
                        .then((data) => {
                            const selected = this._folders.selected;
                            Sites.CreatePublication(selected.tag, menuData.name, data);
                        })
                        .catch(() => { });
                }
                else {
                    App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
                }
                contextMenuObject.Dispose();
            });

        });


    }

    __doubleClickedOnPublication(event, args) {
        this._editData.Dispatch('Clicked');
    }

    __editDataButtonClicked(event, args) {
        const pub = this._publications.selected.value;

        Promise.all([
            Manage.Store.AsyncQuery('manage.storages(' + pub.storage + ')'),
            Sites.LoadRow(pub.storage, pub.row, pub)
        ]).then((responses) => {
            const storage = responses[0];
            const data = responses[1];
            if (Security.IsCommandAllowed('sites.storages.' + storage.name + '.edit')) {
                Manage.FormWindow.Show('Новая строка «' + storage.desc + '»', 1024, 'app.manage.storages(' + storage.name + ')', data)
                    .then((data) => {
                        Sites.SaveData(storage.name, data, pub);
                    })
                    .catch(() => { });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }
        });
    }

    __publishButtonClicked(event, args) {

        const wnd = new App.Modules.Sites.DataWindow('publish', document.body, 'Публикация данных');
        wnd.Show((storage, dataIds) => {
            const selected = this._folders.selected;
            Sites.Publish(selected?.tag, storage.name, dataIds);
        });


    }


}