App.Modules.Sites.StoragesPage = class extends Colibri.UI.Component {

    constructor(name, container) {
        super(name, container, Colibri.UI.Templates['App.Modules.Sites.StoragesPage']);

        this.AddClass('app-sites-storages-page-component');

        this._storages = this.Children('storages-pane/storages');

        this._storages.AddHandler('ContextMenuIconClicked', (event, args) => this.__renderStoragesContextMenu(event, args))
        this._storages.AddHandler('ContextMenuItemClicked', (event, args) => this.__clickOnStoragesContextMenu(event, args));
        this._storages.AddHandler('DoubleClicked', (event, args) => this.__storagesDoubleClick(event, args));

        this._dragManager = new Colibri.UI.DragManager([this._storages], [this._storages]);
        this._dragManager.AddHandler('DragDropComplete', (event, args) => this.__dragDropComplete(event, args));
        this._dragManager.AddHandler('DragDropOver', (event, args) => this.__dragDropOver(event, args));
        this._storages.sorting = true;    

    }

    _canAddFieldAsChild(field) {
        return field.type === 'json';
    }

    __renderStoragesContextMenu(event, args) {

        let contextmenu = [];

        const node = args.item;
        const tag = node.tag;
        const nodeType = tag.type;
        switch (nodeType) {
            case 'module':
                contextmenu.push({ name: 'new-storage', title: '#{sites-storages-contextmenu-add;Новое хранилище}', icon: Colibri.UI.ContextMenuAddIcon });
                break;
            case 'storage':
                contextmenu.push({ name: 'edit-storage', title: '#{sites-storages-contextmenu-editfields;Редактировать свойства хранилища}', icon: Colibri.UI.ContextMenuEditIcon });
                contextmenu.push({ name: 'remove-storage', title: '#{sites-storages-contextmenu-remove;Удалить хранилище}', icon: Colibri.UI.ContextMenuRemoveIcon });
                contextmenu.push({ name: 'new-field', title: '#{sites-storages-contextmenu-newfield;Новое свойство}', icon: Colibri.UI.ContextMenuAddIcon });
                contextmenu.push({ name: 'new-index', title: '#{sites-storages-contextmenu-newindex;Новый индекс}', icon: Colibri.UI.ContextMenuAddIcon });
                break;
            case 'fields':
                contextmenu.push({ name: 'new-field', title: '#{sites-storages-contextmenu-newfield;Новое свойство}', icon: Colibri.UI.ContextMenuAddIcon });
                break;
            case 'field':
                contextmenu.push({ name: 'edit-field', title: '#{sites-storages-contextmenu-editfield;Редактировать свойство}', icon: Colibri.UI.ContextMenuEditIcon });
                contextmenu.push({ name: 'remove-field', title: '#{sites-storages-contextmenu-removefield;Удалить свойство}', icon: Colibri.UI.ContextMenuRemoveIcon });
                if (this._canAddFieldAsChild(tag.entry)) {
                    contextmenu.push({ name: 'new-field', title: '#{sites-storages-contextmenu-newfield;Новое свойство}', icon: Colibri.UI.ContextMenuAddIcon });
                }
                break;
            case 'indices':
                contextmenu.push({ name: 'new-index', title: '#{sites-storages-contextmenu-newindex;Новый индекс}', icon: Colibri.UI.ContextMenuAddIcon });
                break;
            case 'index':
                contextmenu.push({ name: 'edit-index', title: '#{sites-storages-contextmenu-editindex;Редактировать индекс}', icon: Colibri.UI.ContextMenuEditIcon });
                contextmenu.push({ name: 'remove-index', title: '#{sites-storages-contextmenu-removeindex;Удалить индекс}', icon: Colibri.UI.ContextMenuRemoveIcon });
                break;
        }

        node.contextmenu = contextmenu;
        node.ShowContextMenu(args.isContextMenuEvent ? [Colibri.UI.ContextMenu.RB, Colibri.UI.ContextMenu.RB] : [Colibri.UI.ContextMenu.RB, Colibri.UI.ContextMenu.LB], '', args.isContextMenuEvent ? { left: args.domEvent.clientX, top: args.domEvent.clientY } : null);

    }

    _storageFields() {
        const Field = Colibri.UI.Forms.Field;
        return {
            name: 'Storage',
            desc: 'Хранилища',
            fields: {
                name: {
                    type: 'varchar',
                    component: 'Text',
                    desc: '#{sites-storages-storagename;Наименование хранилища}',
                    note: '#{sites-storages-storagename-note;Пожалуйста, введите наименование. Внимание! должно содержать только латинские буквы и цифры без тире, дефисов и пробелов}',
                    params: {
                        required: true,
                        validate: [{
                            message: '#{sites-storages-storagename-validation-required;Пожалуйста, введите наименование хранилища}',
                            method: '(field, validator) => !!field.value'
                        }, {
                            message: '#{sites-storages-storagename-validation-regexp;Введенный текст не соответствует требованиям}',
                            method: '(field, validator) => !/[^\\w\\d]/.test(field.value)'
                        }]
                    }
                },
                desc: {
                    type: 'varchar',
                    component: 'Text',
                    desc: '#{sites-storages-storagedesc;Описание}',
                    note: '#{sites-storages-storagedesc-note;Описание, в свободной форме}',
                    params: {
                        required: true,
                        validate: [{
                            message: '#{sites-storages-storagedesc-validation-required;Пожалуйста, введите описание хранилища}',
                            method: '(field, validator) => !!field.value'
                        }]
                    }
                },
                'access-point': {
                    type: 'varchar',
                    component: 'Select',
                    desc: '#{sites-storages-storageaccesspoint;Подключение}',
                    note: '#{sites-storages-storageaccesspoint-note;Внинание! Предполагается, что вы знаете, что делаете!}',
                    lookup: () => {
                        return new Promise((rs, rj) => {
                            Manage.Store.AsyncQuery('manage.datapoints').then((points) => {
                                rs({ result: Object.keys(points).map(k => { return { value: k, title: k }; }) });
                            });
                        });
                    },
                    params: {
                        readonly: true,
                        required: true,
                        validate: [{
                            message: '#{sites-storages-storageaccesspoint-validation-required;Пожалуйста, выберите подключение}',
                            method: '(field, validator) => !!field.value'
                        }]
                    }
                },
                components: {
                    type: 'json',
                    component: 'Object',
                    desc: '#{sites-storages-storagecomponents;Компоненты}',
                    note: '#{sites-storages-storagecomponents-note;Компоненты для отображения, если проект в режиме «Приложение»}',
                    vertical: true,
                    fields: {
                        default: {
                            type: 'varchar',
                            desc: '#{sites-storages-storagecomponents-default;Компонент по умолчанию}',
                            component: 'Select',
                            lookup: {
                                method: () => new Promise((resolve, reject) => { 
                                    let ret = []; 
                                    Object.keys(App.Modules).forEach((module) => { 
                                        Object.forEach(eval('App.Modules.' + module + '.Templates'), (name, value) => { 
                                            if(name.indexOf('Template') !== -1) { 
                                                ret.push({value: 'App.Modules.' + module + '.Templates.' + name, title: 'App.Modules.' + module + '.Templates.' + name}); 
                                            } 
                                        }); 
                                    }); 
                                    resolve(ret); 
                                }) 
                            },
                            params: {
                                readonly: true,
                                required: false,
                            }
                        },
                        list: {
                            type: 'varchar',
                            desc: '#{sites-storages-storagecomponents-list;Компонент в списке}',
                            component: 'Select',
                            lookup: {
                                method: () => new Promise((resolve, reject) => { 
                                    let ret = []; 
                                    Object.keys(App.Modules).forEach((module) => { 
                                        Object.forEach(eval('App.Modules.' + module + '.Templates'), (name, value) => { 
                                            if(name.indexOf('Template') !== -1) { 
                                                ret.push({value: 'App.Modules.' + module + '.Templates.' + name, title: 'App.Modules.' + module + '.Templates.' + name}); 
                                            } 
                                        }); 
                                    });  
                                    resolve(ret); 
                                }) 
                            },
                            params: {
                                readonly: true,
                                required: false,
                            }
                        },
                        item: {
                            type: 'varchar',
                            desc: '#{sites-storages-storagecomponents-item;Компонент карточка}',
                            component: 'Select',
                            lookup: {
                                method: () => new Promise((resolve, reject) => { 
                                    let ret = []; 
                                    Object.keys(App.Modules).forEach((module) => { 
                                        Object.forEach(eval('App.Modules.' + module + '.Templates'), (name, value) => { 
                                            if(name.indexOf('Template') !== -1) { 
                                                ret.push({value: 'App.Modules.' + module + '.Templates.' + name, title: 'App.Modules.' + module + '.Templates.' + name}); 
                                            } 
                                        }); 
                                    });  
                                    resolve(ret); 
                                }) 
                            },
                            params: {
                                readonly: true,
                                required: false,
                            }
                        }
                    }
                },
                models: {
                    type: 'json',
                    component: 'Object',
                    desc: '#{sites-storages-storagemodels;Модели}',
                    note: '#{sites-storages-storagemodels-note;Название классов моделей. Внимание! Неймспейс должен начинаться с Models\\}',
                    fields: {
                        table: {
                            type: 'varchar',
                            desc: '#{sites-storages-storagemodels-table;Таблица}',
                            component: 'Text'
                        },
                        row: {
                            type: 'varchar',
                            component: 'Text',
                            desc: '#{sites-storages-storagemodels-row;Строка}'
                        }
                    },
                    params: {
                        validate: [{
                            message: '#{sites-storages-storagemodels-validation-required;Пожалуйста, введите наименование классов моделей таблицы и строки}',
                            method: '(field, validator) => !!field.value.table && !!field.value.row'
                        }]
                    }
                },
                params: {
                    type: 'json',
                    component: 'Object',
                    desc: '#{sites-storages-storageadditional;Дополнительные параметры}',
                    vertical: true,
                    fields: {
                        visible: {
                            type: 'bool',
                            placeholder: '#{sites-storages-storageadditional-visible;Отображать в менеджере хранилищ}',
                            component: 'Checkbox',
                            default: true
                        },
                        maybepublished: {
                            type: 'bool',
                            placeholder: '#{sites-storages-storageadditional-maybepublished;Данные могут быть опубликованы}',
                            component: 'Checkbox',
                            default: true
                        }
                    }
                }
            }
        };
    }

    _fieldFields(showGroup = true) {
        const fields = {
            name: 'Field',
            desc: 'Свойство',
            fields: {
                name: {
                    type: 'varchar',
                    component: 'Text',
                    group: 'window',
                    desc: '#{sites-storages-fieldname;Наименование свойства}',
                    note: '#{sites-storages-fieldname-note;Пожалуйста, введите наименование. Внимание! должно содержать только латинские буквы и цифры без тире, дефисов и пробелов.}',
                    params: {
                        required: true,
                        validate: [{
                            message: '#{sites-storages-fieldname-validation-required;Пожалуйста, введите наименование свойства}',
                            method: '(field, validator) => !!field.value'
                        }, {
                            message: '#{sites-storages-fieldname-validation-regexp;Введенный текст не соответствует требованиям}',
                            method: '(field, validator) => !/[^\\w\\d]/.test(field.value)'
                        }]
                    }
                },
                group: {
                    type: 'varchar',
                    component: 'Text',
                    group: 'window',
                    desc: '#{sites-storages-fieldgroup;Группа свойств}',
                    note: '#{sites-storages-fieldgroup-note;Наименование группы, если нужно оставить в основной то нужно написать "window"}',
                    default: 'window',
                    params: {
                        required: true,
                        validate: [{
                            message: '#{sites-storages-fieldgroup-validation-required;Пожалуйста, введите группу свойств}',
                            method: '(field, validator) => !!field.value'
                        }]
                    }
                },
                desc: {
                    type: 'varchar',
                    component: 'Text',
                    group: 'window',
                    desc: '#{sites-storages-fielddesc;Описание свойства}',
                    note: '#{sites-storages-fielddesc-note;Можно на русском языке. Внимание! Описание должно полностью описывать свойство, учитывайте, что модель будет возвращать модель указанную в поле Класс.}',
                    params: {
                        required: true,
                        validate: [{
                            message: '#{sites-storages-fielddesc-validation-required;Пожалуйста, опишите свойство}',
                            method: '(field, validator) => !!field.value'
                        }]
                    }
                },
                type: {
                    type: 'varchar',
                    component: 'Text',
                    group: 'window',
                    desc: '#{sites-storages-fieldtype;Тип свойства (для хранения в источнике данных)}',
                    note: '#{sites-storages-fieldtype-note;Внинание! Предполагается, что вы знаете, что делаете!}',
                    params: {
                        required: true,
                        validate: [{
                            message: '#{sites-storages-fieldtype-validation-required;Пожалуйста, введите тип свойства}',
                            method: '(field, validator) => !!field.value'
                        }]
                    }
                },
                length: {
                    type: 'integer',
                    component: 'Number',
                    group: 'window',
                    desc: '#{sites-storages-fieldlength;Длина в байтах}',
                    note: '#{sites-storages-fieldlength-note;Внинание! Предполагается, что вы знаете, что делаете!}',
                    params: {
                        required: false,
                    }
                },
                component: {
                    type: 'varchar',
                    component: 'Select',
                    group: 'window',
                    desc: '#{sites-storages-fieldcomponent;Компонента}',
                    note: '#{sites-storages-fieldcomponent-note;Выберите компоненту, которая будет использоваться в формах для ввода и редактирования данных}',
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
                                        components.push({ value: name, title: name, icon: Colibri.UI.FieldIcons[name] });
                                    }
                                }

                                rs({ result: components });
                            });
                        });
                    },
                    params: {
                        validate: [{
                            message: '#{sites-storages-fieldcomponent-validation-required;Пожалуйста, выберите компоненту}',
                            method: '(field, validator) => !!field.value'
                        }]
                    }
                },
                class: {
                    type: 'varchar',
                    component: 'Text',
                    group: 'window',
                    desc: '#{sites-storages-fieldclass;Класс (PHP)}',
                    note: '#{sites-storages-fieldclass-note;Внимание! Класс должен существовать}',
                    params: {
                        required: true,
                        validate: [{
                            message: '#{sites-storages-fieldclass-validation-required;Пожалуйста, выберите наименование класса}',
                            method: '(field, validator) => !!field.value'
                        }]
                    }
                },
                
                hasdefault: {
                    type: 'bool',
                    group: 'window',
                    component: 'Checkbox',
                    placeholder: '#{sites-storages-fieldsetdefault;Указать значение по умолчанию}'
                },
                default: {
                    type: 'varchar',
                    group: 'window',
                    component: 'TextArea',
                    desc: '#{sites-storages-fielddefault;Значение по умолчанию}',
                    note: '#{sites-storages-fielddefault-note;Введите значение по умолчанию. Внимание! Предполагается что вы знаете что делаете}',
                    params: {
                        condition: {
                            field: 'hasdefault',
                            value: true,
                        }
                    }
                },
                
                attrs: {
                    type: 'json',
                    component: 'Object',
                    group: '#{sites-storages-fieldattrs;Аттрибуты}',
                    desc: '#{sites-storages-fieldattrs;Аттрибуты}',
                    note: '#{sites-storages-fieldattrs-note;Атрибуты компонента}',
                    params: {
                        required: false
                    },
                    fields: {
                        width: {
                            type: 'int',
                            component: 'Number',
                            desc: '#{sites-storages-fieldattrs-width;Ширина}',
                        },
                        height: {
                            type: 'int',
                            component: 'Number',
                            desc: '#{sites-storages-fieldattrs-height;Высота}',
                        },
                        class: {
                            type: 'varchar',
                            component: 'Text',
                            desc: '#{sites-storages-fieldattrs-class;Класс}',
                        },
                    }
                },
                params: {
                    type: 'json',
                    component: 'Object',
                    group: '#{sites-storages-fieldparams;Дополнительные параметры}',
                    desc: '#{sites-storages-fieldparams;Дополнительные параметры}',
                    vertical: true,
                    fields: {
                        required: {
                            type: 'bool',
                            placeholder: '#{sites-storages-fieldparams-required;Обязательное поле}',
                            note: '#{sites-storages-fieldparams-required-note;Будет требоваться ввести значение в форме. Пустое значение будет трактоваться как "нет значения"}',
                            component: 'Checkbox',
                            default: false
                        },
                        enabled: {
                            type: 'bool',
                            placeholder: '#{sites-storages-fieldparams-enabled;Поле включено}',
                            note: '#{sites-storages-fieldparams-enabled-note;Не будет возможности ввести или изменить поле. Значение не будет передаваться в форме, если не будет введено}',
                            component: 'Checkbox',
                            default: true
                        },
                        readonly: {
                            type: 'bool',
                            placeholder: '#{sites-storages-fieldparams-readonly;Только для чтения}',
                            note: '#{sites-storages-fieldparams-readonly-note;Не будет возможности ввести или изменить данные}',
                            component: 'Checkbox',
                            default: false
                        },
                        visual: {
                            type: 'bool',
                            placeholder: '#{sites-storages-fieldparams-visual;Отображать в виде визуального редактора}',
                            note: '#{sites-storages-fieldparams-visual-note;Используется только в большом текстовом поле}',
                            component: 'Checkbox',
                            default: false
                        },
                        code: {
                            type: 'varchar',
                            placeholder: '#{sites-storages-fieldparams-code;Отображать в виде редактора кода}',
                            note: '#{sites-storages-fieldparams-code-note;Используется только в большом текстовом поле}',
                            component: 'Select',
                            default: '',
                            params: {
                                readonly: true,
                                required: false  
                            },
                            selector: {
                                value: 'value',
                                title: 'title'
                            },
                            values: [
                                {value: '', title: ''},
                                {value: 'js', title: 'JavaScript'},
                                {value: 'css', title: 'CSS'},
                                {value: 'less', title: 'Less'},
                                {value: 'scss', title: 'Scss'},
                                {value: 'html', title: 'HTML'},
                                {value: 'php', title: 'PHP'},
                                {value: 'xml', title: 'XML'},
                                {value: 'yaml', title: 'YAML'}
                            ]
                        },
                        list: {
                            type: 'bool',
                            placeholder: '#{sites-storages-fieldparams-list;Отображать в списке}',
                            component: 'Checkbox',
                            default: false
                        },
                        greed: {
                            type: 'varchar',
                            placeholder: '#{sites-storages-fieldparams-greed;Жадность в списке}',
                            note: '#{sites-storages-fieldparams-greed-note;Указывается в процентах}',
                            component: 'Text',
                            default: ''
                        },
                        vertical: {
                            type: 'bool',
                            placeholder: '#{sites-storages-fieldparams-vertical;Отображать обьект вертикально}',
                            note: '#{sites-storages-fieldparams-vertical-note;Работает только с обьектами типа Object и Array}',
                            component: 'Checkbox',
                            default: false
                        },
                        viewer: {
                            type: 'varchar',
                            placeholder: '#{sites-storages-fieldparams-viewer;Класс Viewer (для отображения в списках)}',
                            note: '#{sites-storages-fieldparams-viewer-note;Выберите из списка}',
                            component: 'Select',
                            default: '',
                            selector: {
                                value: 'value',
                                title: 'title'
                            },
                            params: {
                                readonly: true
                            },
                            lookup: {
                                method: () => new Promise((resolve, reject) => {
                                    resolve(Colibri.UI.Viewer.Enum().map(v => { return {value: v.value, title: v.value + ' ' + v.title}; }));
                                })
                            }
                        },
                        mask: {
                            type: 'varchar',
                            placeholder: '#{sites-storages-fieldparams-mask;Маска ввода}',
                            note: '#{sites-storages-fieldparams-mask-note;Работает только с обьектами типа Text}',
                            component: 'Text',
                            default: ''
                        },
                    }
                },
                lookup: {
                    type: 'json',
                    component: 'Object',
                    group: '#{sites-storages-fieldlookup;Связка}',
                    desc: '#{sites-storages-fieldlookup;Связка}',
                    note: '#{sites-storages-fieldlookup-note;Связь с другими хранилищами}',
                    vertical: true,
                    fields: {
                        _oneof: {
                            type: 'varchar',
                            component: 'Radio',
                            default: 'none',      
                            values: [{
                                value: 'none',
                                title: '#{sites-storages-fieldlookup-oneof-none;Нет связи}'
                            }, {
                                value: 'storage',
                                title: '#{sites-storages-fieldlookup-oneof-storage;Хранилище}'
                            }, {
                                value: 'accesspoint',
                                title: '#{sites-storages-fieldlookup-oneof-accesspoint;Точка доступа}'
                            }, {
                                value: 'method',
                                title: '#{sites-storages-fieldlookup-oneof-method;Метод}'
                            }, {
                                value: 'binding',
                                title: '#{sites-storages-fieldlookup-oneof-binding;Байдинг к данным}'
                            }, {
                                value: 'controller',
                                title: '#{sites-storages-fieldlookup-oneof-controller;Контроллер}'
                            }]                      
                        },

                        storage: {
                            type: 'json',
                            component: 'Object',
                            desc: '#{sites-storages-fieldlookup-storage;Хранилище}',
                            fields: {
                                name: {
                                    type: 'varchar',
                                    desc: '#{sites-storages-fieldlookup-storage-name;Хранилище}',
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
                                    desc: '#{sites-storages-fieldlookup-storage-title;Поле для вывода}'
                                },
                                value: {
                                    type: 'varchar',
                                    component: 'Text',
                                    desc: '#{sites-storages-fieldlookup-storage-value;Поле для значения}'
                                },
                                controller: {
                                    type: 'json',
                                    component: 'Object',
                                    desc: '#{sites-storages-fieldlookup-storage-controller;Контроллер (JS)}',
                                    fields: {
                                        module: {
                                            type: 'varchar',
                                            component: 'Text',
                                            desc: '#{sites-storages-fieldlookup-storage-controller-module;Модуль}'
                                        },
                                        class: {
                                            type: 'varchar',
                                            component: 'Text',
                                            desc: '#{sites-storages-fieldlookup-storage-controller-class;Класс}'
                                        },
                                        method: {
                                            type: 'varchar',
                                            component: 'Text',
                                            desc: '#{sites-storages-fieldlookup-storage-controller-method;Метод}'
                                        },
                                    }
                                }
                            },
                            params: {
                                condition: {
                                    field: '_oneof',
                                    value: 'storage',
                                }
                            }
                            
                        },
                        controller: {
                            type: 'json',
                            component: 'Object',
                            desc: '#{sites-storages-fieldlookup-controller;Контроллер (JS)}',
                            fields: {
                                module: {
                                    type: 'varchar',
                                    component: 'Select',
                                    desc: '#{sites-storages-fieldlookup-controller-module;Модуль}',
                                    lookup: () => {
                                        return new Promise((rs, rj) => {
                                            Manage.Store.AsyncQuery('manage.modules').then((modules) => {
                                                let components = [];
                                                for (const module of modules) {
                                                    components.push({ value: module.name, title: module.desc});
                                                }                        
                                                rs({ result: components });
                                            });
                                        });
                                    }
                                },
                                class: {
                                    type: 'varchar',
                                    component: 'Text',
                                    desc: '#{sites-storages-fieldlookup-controller-class;Класс}'
                                },
                                method: {
                                    type: 'varchar',
                                    component: 'Text',
                                    desc: '#{sites-storages-fieldlookup-controller-method;Метод}'
                                },
                            },
                            params: {
                                condition: {
                                    field: '_oneof',
                                    value: 'controller',
                                }
                            }
                        },
                        binding: {
                            type: 'varchar',
                            component: 'Text',
                            desc: '#{sites-storages-fieldlookup-binding;Байндинг}',
                            default: '',
                            params: {
                                condition: {
                                    field: '_oneof',
                                    value: 'binding',
                                }
                            }
                        },
                        method: {
                            type: 'varchar',
                            component: 'TextArea',
                            desc: '#{sites-storages-fieldlookup-method;Метод}',
                            default: '',
                            params: {
                                condition: {
                                    field: '_oneof',
                                    value: 'method',
                                }
                            }
                        },
                        accesspoint: {
                            type: 'json',
                            component: 'Object',
                            desc: '#{sites-storages-fieldlookup-accesspoint;Точка доступа}',
                            default: '',
                            fields: {
                                table:  { type: 'varchar', component: 'Text', default: '', desc: '#{sites-storages-fieldlookup-accesspoint-table;Таблица}'},
                                fields: { type: 'varchar', component: 'Text', default: '', desc: '#{sites-storages-fieldlookup-accesspoint-fields;Список полей}'},
                                filter:  { type: 'varchar', component: 'Text', default: '', desc: '#{sites-storages-fieldlookup-accesspoint-filter;Фильтр}'},
                                order: { type: 'varchar', component: 'Text', default: '', desc: '#{sites-storages-fieldlookup-accesspoint-order;Сортировка}'},
                            },
                            params: {
                                condition: {
                                    field: '_oneof',
                                    value: 'accesspoint',
                                }
                            }
                        }
                    }
                },
                values: {
                    type: 'json',
                    component: 'Array',
                    group: '#{sites-storages-fieldvalues;Значения}',
                    desc: '#{sites-storages-fieldvalues;Значения}',
                    default: [],
                    params: {
                        addlink: 'Добавить значение'
                    },
                    fields: {
                        value: {
                            type: 'varchar',
                            component: 'Text',
                            desc: '#{sites-storages-fieldvalues-value;Поле для значения}'
                        },
                        title: {
                            type: 'varchar',
                            component: 'Text',
                            desc: '#{sites-storages-fieldvalues-title;Поле для вывода}'
                        },
                    }
                },
                selector: {
                    type: 'json',
                    group: '#{sites-storages-fieldselector;Выборка}',
                    desc: '#{sites-storages-fieldselector;Выборка}',
                    note: '#{sites-storages-fieldselector-note;Дополнительные настройки для компонента Select}',
                    component: 'Object',
                    params: {
                        vertical: true,
                    },
                    fields: {
                        value: {
                            type: 'varchar',
                            component: 'Text',
                            desc: '#{sites-storages-fieldselector-value;Поле значения}'
                        },
                        title: {
                            type: 'varchar',
                            component: 'Text',
                            desc: '#{sites-storages-fieldselector-title;Поле заголовка}'
                        },
                        __render: {
                            type: 'varchar',
                            component: 'TextArea',
                            desc: '#{sites-storages-fieldselector-render;Метод для вывода выборки}'
                        },
                        ondemand: {
                            type: 'bool',
                            component: 'Checkbox',
                            default: 0,
                            desc: '#{sites-storages-fieldselector-ondemand;Загружать при запросе}',
                        },
                    }
                },

                
            }
        };
        if(!showGroup) {
            delete fields.fields.group;
        }
        return fields;
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
                    desc: '#{sites-storages-indexname;Наименование индекса}',
                    note: '#{sites-storages-indexname-note;Внимание! Рекомендуется индекс называть следующим образом: storage_fields_idx, где storage название хранилища fields - список полей через _}',
                    params: {
                        required: true,
                        validate: [{
                            message: '#{sites-storages-indexname-validation-required;Пожалуйста, введите наименование индекса}',
                            method: '(field, validator) => !!field.value'
                        }, {
                            message: '#{sites-storages-indexname-validation-regexp;Введенный текст не соответствует требованиям}',
                            method: '(field, validator) => !/[^\\w\\d]/.test(field.value)'
                        }]
                    }
                },
                fields: {
                    type: 'varchar',
                    component: 'Select',
                    multiple: true,
                    desc: '#{sites-storages-indexfields;Спосок свойств}',
                    note: '#{sites-storages-indexfields-note;Выберите список свойств по которым необходимо индексировать}',
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
                        required: true,
                        readonly: true,
                        validate: [{
                            message: '#{sites-storages-indexfields-validation-required;Пожалуйста, выберите свойства}',
                            method: '(field, validator) => !!field.value'
                        }]
                    }
                },
                type: {
                    type: 'varchar',
                    component: 'Select',
                    desc: '#{sites-storages-indextype;Тип индекса}',
                    note: '#{sites-storages-indextype-note;Внинание! Предполагается, что вы знаете, что делаете!}',
                    params: {
                        required: true,
                        readonly: true,
                        validate: [{
                            message: '#{sites-storages-indextype-validation-required;Пожалуйста, выберите тип индекса}',
                            method: '(field, validator) => !!field.value'
                        }]
                    },
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
                    desc: '#{sites-storages-indexmethod;Компонента}',
                    note: '#{sites-storages-indexmethod-note;Выберите компоненту, которая будет использоваться в формах для ввода и редактирования данных}',
                    default: 'BTREE',
                    values: [
                        {value: 'BTREE', title: '#{sites-storages-values-binary;Бинарное дерево}'},
                        {value: 'HASH', title: '#{sites-storages-values-hash;Хэш функция}'},
                    ],
                    params: {
                        required: true,
                        readonly: true,
                        validate: [{
                            message: '#{sites-storages-indexmethod-validation-required;Пожалуйста, выберите метод индексирования}',
                            method: '(field, validator) => !!field.value'
                        }]
                    }
                }
            }
        };
    }

    _getPath(node, add = null) {
        const storageNode = node.FindParent((node) => node.tag.type === 'storage');
        let paths = [];
        let p = node;
        while(p != storageNode) {
            if(p.tag.entry) {
                paths.push(p.tag.entry.name);
            }
            p = p.parentNode;
        }
        paths.reverse();
        add && paths.push(add);
        let path = paths.join('/').trim(/\//);
        return path;
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
            const moduleNode = node.FindParent((node) => node.tag.type === 'module');
            if (Security.IsCommandAllowed('sites.storages.add')) {
                Manage.FormWindow.Show('#{sites-storages-windowtitle-newstorage;Новое хранилище}', 800, this._storageFields(), {})
                    .then((data) => {
                        Sites.SaveStorage(moduleNode.tag.entry, data);
                    })
                    .catch(() => { });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{security-global-notallowed;Действие запрещено}', Colibri.UI.Notice.Error, 5000));
            }
        }
        else if (menuData.name == 'edit-storage') {
            const moduleNode = node.FindParent((node) => node.tag.type === 'module');
            if (Security.IsCommandAllowed('sites.storages.edit')) {
                Manage.FormWindow.Show('#{sites-storages-windowtitle-editstorage;Редактировать хранилище}', 800, this._storageFields(), node.tag.entry)
                    .then((data) => {
                        Sites.SaveStorage(moduleNode.tag.entry, data);
                    })
                    .catch(() => { });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{security-global-notallowed;Действие запрещено}', Colibri.UI.Notice.Error, 5000));
            }

        }
        else if (menuData.name == 'remove-storage') {
            const moduleNode = node.FindParent((node) => node.tag.type === 'module');
            App.Confirm.Show('#{sites-storages-messages-removestorage;Удаление хранилища данных}', '#{sites-storages-messages-removestoragemessage;Вы уверены, что хотите удалить хранилище данных?}', '#{app-confirm-buttons-delete;Удалить!}').then(() => {
                Sites.DeleteStorage(moduleNode.tag.entry, node.tag.entry);
            });
        }
        else if (menuData.name == 'new-field') {
            const moduleNode = node.FindParent((node) => node.tag.type === 'module');
            const storageNode = node.FindParent((node) => node.tag.type === 'storage');
            if (Security.IsCommandAllowed('sites.storages.' + storageNode.tag.entry.name + '.fields')) {
                Manage.FormWindow.Show('#{sites-storages-windowtitle-newproperty;Новое свойство}', 1024, this._fieldFields(node.tag.type === 'fields'), {})
                    .then((data) => {
                        Sites.SaveField(moduleNode.tag.entry, storageNode.tag.entry, this._getPath(node, data.name), data);
                    })
                    .catch(() => { });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{security-global-notallowed;Действие запрещено}', Colibri.UI.Notice.Error, 5000));
            }
        }
        else if (menuData.name == 'edit-field') {
            const moduleNode = node.FindParent((node) => node.tag.type === 'module');
            const storageNode = node.FindParent((node) => node.tag.type === 'storage');
            if (Security.IsCommandAllowed('sites.storages.' + storageNode.tag.entry.name + '.fields')) {
                
                const fieldData = node.tag.entry;
                if(fieldData.default) {
                    fieldData.hasdefault = true;
                }

                Manage.FormWindow.Show('#{sites-storages-windowtitle-editproperty;Редактировать свойство}', 1024, this._fieldFields(node.parentNode.tag.type === 'fields'), node.tag.entry)
                    .then((data) => {
                        Sites.SaveField(moduleNode.tag.entry, storageNode.tag.entry, this._getPath(node), data);
                    })
                    .catch(() => { });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{security-global-notallowed;Действие запрещено}', Colibri.UI.Notice.Error, 5000));
            }

        }
        else if (menuData.name == 'remove-field') {
            const moduleNode = node.FindParent((node) => node.tag.type === 'module');
            const storageNode = node.FindParent((node) => node.tag.type === 'storage');
            const selectedNode = this.selected;
            if (Security.IsCommandAllowed('sites.storages.' + storageNode.tag.entry.name + '.fields')) {
                App.Confirm.Show('#{sites-storages-messages-removeproperty;Удаление свойства}', '#{sites-storages-messages-removepropertymessage;Вы уверены, что хотите удалить свойство?}', '#{app-confirm-buttons-delete;Удалить!}').then(() => {
                    Sites.DeleteField(moduleNode.tag.entry, storageNode.tag.entry, this._getPath(node));
                });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{security-global-notallowed;Действие запрещено}', Colibri.UI.Notice.Error, 5000));
            }

        }
        else if (menuData.name == 'new-index') {
            const moduleNode = node.FindParent((node) => node.tag.type === 'module');
            const storageNode = node.FindParent((node) => node.tag.type === 'storage');
            if (Security.IsCommandAllowed('sites.storages.' + storageNode.tag.entry.name + '.indexes')) {
                Manage.FormWindow.Show('#{sites-storages-windowtitle-newindex;Новый индекс}', 800, this._fieldIndex(storageNode.tag.entry.name), {})
                    .then((data) => {
                        Sites.SaveIndex(moduleNode.tag.entry, storageNode.tag.entry, data);
                    })
                    .catch(() => { });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{security-global-notallowed;Действие запрещено}', Colibri.UI.Notice.Error, 5000));
            }
        }
        else if (menuData.name == 'edit-index') {
            const moduleNode = node.FindParent((node) => node.tag.type === 'module');
            const storageNode = node.FindParent((node) => node.tag.type === 'storage');
            if (Security.IsCommandAllowed('sites.storages.' + storageNode.tag.entry.name + '.indexes')) {
                Manage.FormWindow.Show('#{sites-storages-windowtitle-editindex;Редактировать индекс}', 800, this._fieldIndex(storageNode.tag.entry.name), node.tag.entry)
                    .then((data) => {
                        Sites.SaveIndex(moduleNode.tag.entry, storageNode.tag.entry, data);
                    })
                    .catch(() => { });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{security-global-notallowed;Действие запрещено}', Colibri.UI.Notice.Error, 5000));
            }

        }
        else if (menuData.name == 'remove-index') {
            const moduleNode = node.FindParent((node) => node.tag.type === 'module');
            const storageNode = node.FindParent((node) => node.tag.type === 'storage');
            if (Security.IsCommandAllowed('sites.storages.' + storageNode.tag.entry.name + '.fields')) {
                App.Confirm.Show('#{sites-storages-messages-removeindex;Удаление индекса}', '#{sites-storages-messages-removeindexmessage;Вы уверены, что хотите удалить индекс?}', '#{app-confirm-buttons-delete;Удалить!}').then(() => {
                    Sites.DeleteIndex(moduleNode.tag.entry, storageNode.tag.entry, node.tag.entry);
                });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{security-global-notallowed;Действие запрещено}', Colibri.UI.Notice.Error, 5000));
            }

        }
    }

    __storagesDoubleClick(event, args) {
        const node = this._storages.selected;
        if (!node) {
            return false;
        }
        if(node.tag.type === 'indices') {
            this.__clickOnStoragesContextMenu(event, {menuData: {name: 'new-index'}});
        }
        else if(node.tag.type === 'fields') {
            this.__clickOnStoragesContextMenu(event, {menuData: {name: 'new-field'}});
        }
        else {
            this.__clickOnStoragesContextMenu(event, {menuData: {name: 'edit-' + node.tag.type}});
        }
    }

    __dragDropOver(event, args) {
        const dragged = args.dragged;
        const droppedTo = args.droppedTo;
        const droppedToElement = args.droppedToElement;
        const effects = args.effects;
        if(['storage', 'module', 'fields', 'indices', 'index'].indexOf(dragged.tag.type) !== -1 || ['storage', 'module', 'fields', 'indices', 'index'].indexOf(droppedTo.tag.type) !== -1) {
            effects.effectAllowed = 'none';
            effects.dropEffect = 'none';
        }
        else if(dragged.tag.type === 'field') {

            const draggedField = dragged.tag.entry;
            const draggedFieldParent = dragged.parentNode;
            const draggedStorage = dragged.FindParent((node) => node.tag.type === 'storage');

            const droppedToField = droppedTo.tag.entry;
            const droppedToFieldParent = droppedTo.parentNode;
            const droppedToStorage = droppedTo.FindParent((node) => node.tag.type === 'storage');
            const dropSibling = droppedToElement.attr('drop');

            if(!dropSibling || !draggedStorage || !droppedToStorage || draggedStorage.tag.entry.name != droppedToStorage.tag.entry.name || draggedFieldParent != droppedToFieldParent) {
                effects.effectAllowed = 'none';
                effects.dropEffect = 'none';
            }
            else {
                effects.dropEffect = 'move';
                effects.effectAllowed = 'move';
            }
        }
    }

    __dragDropComplete(event, args) {
        
        const dragged = args.dragged;
        const droppedTo = args.droppedTo;
        const droppedToElement = args.droppedToElement;
        const dropSibling = droppedToElement.attr('drop');

        const moduleNode = dragged.FindParent((node) => node.tag.type === 'module');
        const storageNode = dragged.FindParent((node) => node.tag.type === 'storage');

        Sites.MoveField(moduleNode.tag.entry, storageNode.tag.entry, this._getPath(dragged), this._getPath(droppedTo), dropSibling);

    }


}