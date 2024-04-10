App.Modules.Sites.StoragesPage = class extends Colibri.UI.Component {

    constructor(name, container) {
        super(name, container, Colibri.UI.Templates['App.Modules.Sites.StoragesPage']);

        this.AddClass('app-sites-storages-page-component');

        this._copiedField = null;
        this._storagesPane = this.Children('storages-pane');
        this._storagesCannotchange = this.Children('storages-cannotchange');

        this._storages = this.Children('storages-pane/split/right/storages');
        this._modules = this.Children('storages-pane/split/left/modules');
        

        this._storages.AddHandler('ContextMenuIconClicked', (event, args) => this.__renderStoragesContextMenu(event, args))
        this._storages.AddHandler('ContextMenuItemClicked', (event, args) => this.__clickOnStoragesContextMenu(event, args));
        this._storages.AddHandler('DoubleClicked', (event, args) => this.__storagesDoubleClick(event, args));

        this._modules.AddHandler('SelectionChanged', (event, args) => this.__modulesSelectionChanged(event, args)); 

        this._dragManager = new Colibri.UI.DragManager([this._storages], [this._storages]);
        this._dragManager.AddHandler('DragDropComplete', (event, args) => this.__dragDropComplete(event, args));
        this._dragManager.AddHandler('DragDropOver', (event, args) => this.__dragDropOver(event, args));
        this._storages.sorting = true;    

        App.Store.AsyncQuery('app.settings').then((settings) => {
            if(settings.mode != 'local') {
                this._storagesPane.shown = false;
                this._storagesCannotchange.shown = true;
            } else {
                this._storagesPane.shown = true;
                this._storagesCannotchange.shown = false;
                this._modules.binding = 'app.manage.modules';
                this._storages.binding = 'app.manage.storages';
            }
        });

    }

    _canAddFieldAsChild(field) {
        return field.type === 'json';
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __modulesSelectionChanged(event, args) {
        const selected = this._modules.selected;
        if(!selected) {
            this._storages.value = null;
        } else {

            const module = selected.value;
            this._storages.module = module.name;
            // App.Store.AsyncQuery('app.manage.storages').then(storages => {
            //     const storagesList = Object.values(storages).filter(v => v.module == module.name);
            //     this._storages.value = storagesList;
            // });
        }
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __renderStoragesContextMenu(event, args) {

        let contextmenu = [];

        const node = args.item;
        const tag = node.tag;
        const nodeType = tag.type;
        switch (nodeType) {
            case 'module':
                contextmenu.push({ name: 'new-storage', title: '#{sites-storages-contextmenu-add}', icon: Colibri.UI.ContextMenuAddIcon });
                break;
            case 'storage':
                contextmenu.push({ name: 'edit-storage', title: '#{sites-storages-contextmenu-editfields}', icon: Colibri.UI.ContextMenuEditIcon });
                contextmenu.push({ name: 'remove-storage', title: '#{sites-storages-contextmenu-remove}', icon: Colibri.UI.ContextMenuRemoveIcon });
                contextmenu.push({ name: 'new-field', title: '#{sites-storages-contextmenu-newfield}', icon: Colibri.UI.ContextMenuAddIcon });
                contextmenu.push({ name: 'new-index', title: '#{sites-storages-contextmenu-newindex}', icon: Colibri.UI.ContextMenuAddIcon });
                break;
            case 'fields':
                contextmenu.push({ name: 'new-field', title: '#{sites-storages-contextmenu-newfield}', icon: Colibri.UI.ContextMenuAddIcon });
                contextmenu.push({ name: 'new-virtual-field', title: '#{sites-storages-contextmenu-newvirtualfield}', icon: Colibri.UI.ContextMenuAddIcon });
                if(this._copiedField !== null) {
                    contextmenu.push({ name: 'paste-field', title: '#{sites-storages-contextmenu-pastefield}', icon: Colibri.UI.ContextMenuPasteIcon });
                }
                break;
            case 'field':
                contextmenu.push({ name: 'edit-field', title: '#{sites-storages-contextmenu-editfield}', icon: Colibri.UI.ContextMenuEditIcon });
                contextmenu.push({ name: 'remove-field', title: '#{sites-storages-contextmenu-removefield}', icon: Colibri.UI.ContextMenuRemoveIcon });
                if (this._canAddFieldAsChild(tag.entry)) {
                    contextmenu.push({ name: 'new-field', title: '#{sites-storages-contextmenu-newfield}', icon: Colibri.UI.ContextMenuAddIcon });
                }
                contextmenu.push({ name: 'copy-field', title: '#{sites-storages-contextmenu-copyfield}', icon: Colibri.UI.ContextMenuCopyIcon });
                if (this._canAddFieldAsChild(tag.entry) && this._copiedField !== null) {
                    contextmenu.push({ name: 'paste-field', title: '#{sites-storages-contextmenu-pastefield}', icon: Colibri.UI.ContextMenuPasteIcon });
                }
                break;
            case 'indices':
                contextmenu.push({ name: 'new-index', title: '#{sites-storages-contextmenu-newindex}', icon: Colibri.UI.ContextMenuAddIcon });
                break;
            case 'index':
                contextmenu.push({ name: 'edit-index', title: '#{sites-storages-contextmenu-editindex}', icon: Colibri.UI.ContextMenuEditIcon });
                contextmenu.push({ name: 'remove-index', title: '#{sites-storages-contextmenu-removeindex}', icon: Colibri.UI.ContextMenuRemoveIcon });
                break;
        }

        node.contextmenu = contextmenu;
        node.ShowContextMenu(args.isContextMenuEvent ? [Colibri.UI.ContextMenu.RB, Colibri.UI.ContextMenu.RB] : [Colibri.UI.ContextMenu.RB, Colibri.UI.ContextMenu.LB], '', args.isContextMenuEvent ? { left: args.domEvent.clientX, top: args.domEvent.clientY } : null);

    }

    _storageFields() {
        return {
            name: 'Storage',
            desc: 'Хранилища',
            fields: {
                name: {
                    type: 'varchar',
                    component: 'Text',
                    group: 'window',
                    desc: '#{sites-storages-storagename}',
                    note: '#{sites-storages-storagename-note}',
                    params: {
                        required: true,
                        validate: [{
                            message: '#{sites-storages-storagename-validation-required}',
                            method: '(field, validator) => !!field.value'
                        }, {
                            message: '#{sites-storages-storagename-validation-regexp}',
                            method: '(field, validator) => !/[^\\w\\d]/.test(field.value)'
                        }]
                    }
                },
                desc: {
                    type: 'varchar',
                    component: 'App.Modules.Lang.UI.Text',
                    group: 'window',
                    desc: '#{sites-storages-storagedesc}',
                    note: '#{sites-storages-storagedesc-note}',
                    params: {
                        required: true,
                        validate: [{
                            message: '#{sites-storages-storagedesc-validation-required}',
                            method: '(field, validator) => Object.values(Object.map(field.value, (key, value) => !!value)).indexOf(true) !== -1'
                        }]
                    }
                },
                group_enabled: {
                    type: 'boolean',
                    component: 'Checkbox',
                    placeholder: '#{sites-storages-storagegroupenabled}',
                    group: 'window',
                    default: false,
                    params: {
                        required: true,
                    }
                },
                group: {
                    type: 'varchar',
                    component: 'App.Modules.Lang.UI.Text',
                    group: 'window',
                    desc: '#{sites-storages-storagegroup}',
                    params: {
                        required: false,
                        condition: {
                            field: 'group_enabled',
                            value: true,
                        }
                    }
                },
                'access-point': {
                    type: 'varchar',
                    group: 'window',
                    component: 'Select',
                    desc: '#{sites-storages-storageaccesspoint}',
                    note: '#{sites-storages-storageaccesspoint-note}',
                    lookup: () => {
                        return new Promise((rs, rj) => {
                            Manage.Store.AsyncQuery('manage.datapoints').then((points) => {
                                rs({ result: Object.keys(points).map(k => { return { value: k, title: k }; }) });
                            });
                        });
                    },
                    params: {
                        readonly: false,
                        required: true,
                        searchable: false,
                        validate: [{
                            message: '#{sites-storages-storageaccesspoint-validation-required}',
                            method: '(field, validator) => !!field.value'
                        }]
                    }
                },
                models: {
                    type: 'json',
                    component: 'Object',
                    desc: '#{sites-storages-storagemodels}',
                    note: '#{sites-storages-storagemodels-note}',
                    group: 'window',
                    fields: {
                        table: {
                            type: 'varchar',
                            desc: '#{sites-storages-storagemodels-table}',
                            component: 'Text'
                        },
                        row: {
                            type: 'varchar',
                            component: 'Text',
                            desc: '#{sites-storages-storagemodels-row}'
                        }
                    },
                    params: {
                        validate: [{
                            message: '#{sites-storages-storagemodels-validation-required}',
                            method: '(field, validator) => !!field.value.table && !!field.value.row'
                        }]
                    }
                },
                components: {
                    type: 'json',
                    group: '#{sites-storages-storagecomponents}',
                    component: 'Object',
                    note: '#{sites-storages-storagecomponents-note}',
                    params: {
                        vertical: true,
                    },
                    fields: {
                        default: {
                            type: 'varchar',
                            desc: '#{sites-storages-storagecomponents-default}',
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
                                readonly: false,
                                required: false,
                                searchable: false
                            }
                        },
                        list: {
                            type: 'varchar',
                            desc: '#{sites-storages-storagecomponents-list}',
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
                                readonly: false,
                                required: false,
                                searchable: false
                            }
                        },
                        item: {
                            type: 'varchar',
                            desc: '#{sites-storages-storagecomponents-item}',
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
                                readonly: false,
                                required: false,
                                searchable: false
                            }
                        }
                    }
                },
                templates: {
                    type: 'json',
                    group: '#{sites-storages-storagetemplates}',
                    component: 'Object',
                    note: '#{sites-storages-storagetemplates-note}',
                    params: {
                        vertical: true,
                    },
                    fields: {
                        default: {
                            type: 'varchar',
                            desc: '#{sites-storages-storagetemplates-default}',
                            component: 'Select',
                            lookup: {
                                depends: 'module',
                                method: (term, dependsValue) => new Promise((resolve, reject) => { 
                                    let ret = [{value: "", title: "#{sites-storages-storagetemplates-default-unselected}"}]; 
                                    Manage.Store.AsyncQuery("manage.templates" + (dependsValue ? "(" + dependsValue.toLowerCase() + ")" : ""), null, true).then((templates) => {
                                        templates && Array.isArray(templates) && templates.forEach(template => {
                                            ret.push({value: template.path, title: template.path}); 
                                        });
                                        resolve(ret); 
                                    });  
                                }) 
                            },
                            params: {
                                readonly: false,
                                required: false,
                                searchable: false
                            },
                            selector: {
                                ondemand: true
                            }
                        },
                        list: {
                            type: 'varchar',
                            desc: '#{sites-storages-storagetemplates-list}',
                            component: 'Select',
                            lookup: {
                                depends: 'module',
                                method: (term, dependsValue) => new Promise((resolve, reject) => { 
                                    let ret = [{value: "", title: "#{sites-storages-storagetemplates-default-unselected}"}]; 
                                    Manage.Store.AsyncQuery("manage.templates" + (dependsValue ? "(" + dependsValue.toLowerCase() + ")" : ""), null, true).then((templates) => {
                                        templates && Array.isArray(templates) && templates.forEach(template => {
                                            ret.push({value: template.path, title: template.path}); 
                                        });
                                        resolve(ret); 
                                    });  
                                }) 
                            },
                            params: {
                                readonly: false,
                                required: false,
                                searchable: false
                            },
                            selector: {
                                ondemand: true
                            }
                        },
                        item: {
                            type: 'varchar',
                            desc: '#{sites-storages-storagetemplates-item}',
                            component: 'Select',
                            lookup: {
                                depends: 'module',
                                method: (term, dependsValue) => new Promise((resolve, reject) => { 
                                    let ret = [{value: "", title: "#{sites-storages-storagetemplates-default-unselected}"}]; 
                                    Manage.Store.AsyncQuery("manage.templates" + (dependsValue ? "(" + dependsValue.toLowerCase() + ")" : ""), null, true).then((templates) => {
                                        templates && Array.isArray(templates) && templates.forEach(template => {
                                            ret.push({value: template.path, title: template.path}); 
                                        });
                                        resolve(ret); 
                                    });  
                                }) 
                            },
                            params: {
                                readonly: false,
                                searchable: false,
                                required: false,
                            },
                            selector: {
                                ondemand: true
                            }
                        }
                    }
                },
                params: {
                    type: 'json',
                    component: 'Object',
                    group: '#{sites-storages-storageadditional}',
                    params: {
                        vertical: true,
                    },
                    fields: {
                        visible: {
                            type: 'bool',
                            placeholder: '#{sites-storages-storageadditional-visible}',
                            component: 'Checkbox',
                            default: true
                        },
                        maybepublished: {
                            type: 'bool',
                            placeholder: '#{sites-storages-storageadditional-maybepublished}',
                            component: 'Checkbox',
                            default: true
                        },
                        softdeletes: {
                            type: 'bool',
                            placeholder: '#{sites-storages-storageadditional-softdeletes}',
                            component: 'Checkbox',
                            default: false
                        },
                        deletedautoshow: {
                            type: 'bool',
                            placeholder: '#{sites-storages-storageadditional-deletedautoshow}',
                            component: 'Checkbox',
                            default: false
                        },
                        template_args: {
                            type: 'object',
                            desc: '#{sites-storages-fieldparams-template-args}',
                            component: 'Object',
                            params: {
                                vertical: true,
                            },
                            fields: {
                                rows: {
                                    component: 'Text',
                                    desc: '#{sites-storages-fieldparams-template-args-rows}'
                                },
                                columns: {
                                    component: 'Text',
                                    desc: '#{sites-storages-fieldparams-template-args-columns}'
                                },
                                orientation: {
                                    component: 'Select',
                                    desc: '#{sites-storages-fieldparams-template-args-orientation}',
                                    values: [
                                        {value: 'vr', title: '#{sites-storages-fieldparams-template-args-orientation-vr}'},
                                        {value: 'hr', title: '#{sites-storages-fieldparams-template-args-orientation-hr}'}
                                    ],
                                    params: {
                                        readonly: false,
                                        searchable: false,
                                        required: false
                                    }
                                },
                                flow: {
                                    component: 'Select',
                                    desc: '#{sites-storages-fieldparams-template-args-flow}',
                                    values: [
                                        {value: 'row', title: '#{sites-storages-fieldparams-template-args-flow-row}'},
                                        {value: 'column', title: '#{sites-storages-fieldparams-template-args-flow-column}'}
                                    ],
                                    params: {
                                        readonly: false,
                                        searchable: false,
                                        required: false
                                    }
                                },
                                gap: {
                                    component: 'Text',
                                    desc: '#{sites-storages-fieldparams-template-args-gap}'
                                }
                            }
                        },
                    }
                }
            }
        };
    }

    _fieldFields(showGroup = true, moduleNode) {
        const fields = {
            name: 'Field',
            desc: 'Свойство',
            fields: {
                name: {
                    type: 'varchar',
                    component: 'Text',
                    group: 'window',
                    desc: '#{sites-storages-fieldname}',
                    note: '#{sites-storages-fieldname-note}',
                    params: {
                        required: true,
                        validate: [{
                            message: '#{sites-storages-fieldname-validation-required}',
                            method: '(field, validator) => !!field.value'
                        }, {
                            message: '#{sites-storages-fieldname-validation-regexp}',
                            method: '(field, validator) => !/[^\\w\\d]/.test(field.value)'
                        }]
                    }
                },
                group_enabled: {
                    type: 'boolean',
                    component: 'Checkbox',
                    placeholder: '#{sites-storages-fieldgroupenabled}',
                    group: 'window',
                    default: false,
                    params: {
                        required: true,
                    }
                },
                group: {
                    type: 'varchar',
                    component: 'App.Modules.Lang.UI.Text',
                    group: 'window',
                    desc: '#{sites-storages-fieldgroup}',
                    note: '#{sites-storages-fieldgroup-note}',
                    default: 'window',
                    params: {
                        required: true,
                        condition: {
                            field: 'group_enabled',
                            value: true,
                        },
                        validate: [{
                            message: '#{sites-storages-fieldgroup-validation-required}',
                            method: '(field, validator) => !!field.value'
                        }]
                    }
                },
                desc: {
                    type: 'varchar',
                    component: 'App.Modules.Lang.UI.TextArea',
                    group: 'window',
                    desc: '#{sites-storages-fielddesc}',
                    note: '#{sites-storages-fielddesc-note}',
                    params: {
                        required: true,
                        validate: [{
                            message: '#{sites-storages-fielddesc-validation-required}',
                            method: '(field, validator) => !!field.value'
                        }]
                    }
                },
                placeholder: {
                    type: 'varchar',
                    component: 'App.Modules.Lang.UI.TextArea',
                    group: 'window',
                    desc: '#{sites-storages-fieldplaceholder}',
                    note: '#{sites-storages-fieldplaceholder-note}',
                    params: {
                        required: false
                    }
                },
                note: {
                    type: 'varchar',
                    component: 'App.Modules.Lang.UI.TextArea',
                    group: 'window',
                    desc: '#{sites-storages-fieldnote}',
                    note: '#{sites-storages-fieldnote-note}',
                    params: {
                        required: false
                    }
                },
                type: {
                    type: 'varchar',
                    component: 'Text',
                    group: 'window',
                    desc: '#{sites-storages-fieldtype}',
                    note: '#{sites-storages-fieldtype-note}',
                    params: {
                        required: true,
                        validate: [{
                            message: '#{sites-storages-fieldtype-validation-required}',
                            method: '(field, validator) => !!field.value'
                        }]
                    }
                },
                length: {
                    type: 'integer',
                    component: 'Number',
                    group: 'window',
                    desc: '#{sites-storages-fieldlength}',
                    note: '#{sites-storages-fieldlength-note}',
                    params: {
                        required: false,
                    }
                },
                component: {
                    type: 'varchar',
                    component: 'Select',
                    group: 'window',
                    desc: '#{sites-storages-fieldcomponent}',
                    note: '#{sites-storages-fieldcomponent-note}',
                    selector: {
                        __render: (itemData) => '<div style="display: flex; align-items: center;">' + (itemData.icon ?? '<svg width="28" height="28"></svg>') + '<span style="display: block; margin-left: 10px;">' + itemData.title + '</span></div>'
                    },
                    lookup: () => {
                        return new Promise((rs, rj) => {
                            let components = [];
                            Object.forEach(Colibri.UI.Forms.Field.Components, (name, value) => {
                                components.push({ value: value.className, title: name, icon: value.icon });
                            });
                            components.push({value: 'Colibri.UI.Forms.Hidden', title: 'Hidden'});
                            rs({ result: components });
                        });
                    },
                    params: {
                        required: true,
                        readonly: false,
                        searchable: false,
                        validate: [{
                            message: '#{sites-storages-fieldcomponent-validation-required}',
                            method: '(field, validator) => !!field.value'
                        }]
                    }
                },
                class: {
                    type: 'varchar',
                    component: 'Text',
                    group: 'window',
                    desc: '#{sites-storages-fieldclass}',
                    note: '#{sites-storages-fieldclass-note}',
                    params: {
                        required: true,
                        validate: [{
                            message: '#{sites-storages-fieldclass-validation-required}',
                            method: '(field, validator) => !!field.value'
                        }]
                    }
                },
                
                hasdefault: {
                    type: 'bool',
                    group: 'window',
                    component: 'Checkbox',
                    placeholder: '#{sites-storages-fieldsetdefault}'
                },
                default: {
                    type: 'varchar',
                    group: 'window',
                    component: 'TextArea',
                    desc: '#{sites-storages-fielddefault}',
                    note: '#{sites-storages-fielddefault-note}',
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
                    group: '#{sites-storages-fieldattrs-group}',
                    desc: '#{sites-storages-fieldattrs}',
                    note: '#{sites-storages-fieldattrs-note}',
                    params: {
                        required: false
                    },
                    fields: {
                        width: {
                            type: 'varchar',
                            component: 'Text',
                            desc: '#{sites-storages-fieldattrs-width}',
                        },
                        height: {
                            type: 'varchar',
                            component: 'Text',
                            desc: '#{sites-storages-fieldattrs-height}',
                        },
                        class: {
                            type: 'varchar',
                            component: 'Text',
                            desc: '#{sites-storages-fieldattrs-class}',
                        },
                    }
                },
                params: {
                    type: 'json',
                    component: 'Object',
                    group: '#{sites-storages-fieldparams-group}',
                    desc: '#{sites-storages-fieldparams}',
                    params: {
                        vertical: true,
                    },
                    fields: {
                        required: {
                            type: 'bool',
                            placeholder: '#{sites-storages-fieldparams-required}',
                            note: '#{sites-storages-fieldparams-required-note}',
                            component: 'Checkbox',
                            default: false
                        },
                        enabled: {
                            type: 'bool',
                            placeholder: '#{sites-storages-fieldparams-enabled}',
                            note: '#{sites-storages-fieldparams-enabled-note}',
                            component: 'Checkbox',
                            default: true
                        },
                        canbeempty: {
                            type: 'bool',
                            placeholder: '#{sites-storages-fieldparams-canbeempty}',
                            note: '#{sites-storages-fieldparams-canbeempty-note}',
                            component: 'Checkbox',
                            default: true
                        },
                        readonly: {
                            type: 'bool',
                            placeholder: '#{sites-storages-fieldparams-readonly}',
                            note: '#{sites-storages-fieldparams-readonly-note}',
                            component: 'Checkbox',
                            default: false
                        },
                        searchable: {
                            type: 'bool',
                            placeholder: '#{sites-storages-fieldparams-searchable}',
                            note: '#{sites-storages-fieldparams-searchable-note}',
                            component: 'Checkbox',
                            default: false
                        },
                        list: {
                            type: 'bool',
                            placeholder: '#{sites-storages-fieldparams-list}',
                            component: 'Checkbox',
                            default: false
                        },
                        template: {  
                            type: 'bool',
                            placeholder: '#{sites-storages-fieldparams-template}',
                            component: 'Checkbox',
                            default: false
                        },
                        multiple: {
                            type: 'bool',
                            placeholder: '#{sites-storages-fieldparams-multiple}',
                            note: '#{sites-storages-fieldparams-readonly-note}',
                            component: 'Checkbox',
                            default: false
                        },
                        greed: {
                            type: 'varchar',
                            placeholder: '#{sites-storages-fieldparams-greed}',
                            note: '#{sites-storages-fieldparams-greed-note}',
                            component: 'Text',
                            default: ''
                        },
                        viewer: {
                            type: 'varchar',
                            placeholder: '#{sites-storages-fieldparams-viewer}',
                            note: '#{sites-storages-fieldparams-viewer-note}',
                            component: 'Select',
                            default: '',
                            selector: {
                                value: 'value',
                                title: 'title'
                            },
                            params: {
                                readonly: false,
                                searchable: false
                            },
                            lookup: () => new Promise((resolve, reject) => {
                                resolve(Colibri.UI.Viewer.Enum().map(v => { return {value: v.value, title: v.value + ' ' + v.title}; }));
                            })
                        },
                        vertical: {
                            type: 'bool',
                            placeholder: '#{sites-storages-fieldparams-vertical}',
                            note: '#{sites-storages-fieldparams-vertical-note}',
                            component: 'Checkbox',
                            default: false
                        },
                        visual: {
                            type: 'bool',
                            placeholder: '#{sites-storages-fieldparams-visual}',
                            note: '#{sites-storages-fieldparams-visual-note}',
                            component: 'Checkbox',
                            default: false
                        },
                        code: {
                            type: 'varchar',
                            placeholder: '#{sites-storages-fieldparams-code}',
                            note: '#{sites-storages-fieldparams-code-note}',
                            component: 'Select',
                            default: '',
                            params: {
                                readonly: false,
                                searchable: false,
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
                        mask: {
                            type: 'varchar',
                            placeholder: '#{sites-storages-fieldparams-mask}',
                            note: '#{sites-storages-fieldparams-mask-note}',
                            component: 'Text',
                            default: ''
                        },
                        fieldgenerator: {
                            type: 'varchar',
                            placeholder: '#{sites-storages-fieldparams-fieldgenerator}',
                            component: 'TextArea',
                            default: ''
                        },
                        generator: {
                            type: 'varchar',
                            placeholder: '#{sites-storages-fieldparams-generator}',
                            note: '#{sites-storages-fieldparams-generator-note}',
                            component: 'TextArea',
                            default: ''
                        },
                        noteClass: {
                            type: 'varchar',
                            component: 'Text',
                            placeholder: '#{sites-storages-fieldparams-note-class}',
                            default: ''
                        },
                        simplearraywidth: {
                            type: 'int',
                            placeholder: '#{sites-storages-fieldparams-simplearraywidth}',
                            note: '#{sites-storages-fieldparams-simplearraywidth-note}',
                            component: 'Number',
                            default: ''
                        },
                        simplearrayheight: {
                            type: 'int',
                            placeholder: '#{sites-storages-fieldparams-simplearrayheight}',
                            note: '#{sites-storages-fieldparams-simplearrayheight-note}',
                            component: 'Number',
                            default: ''
                        },
                        addlink: { 
                            type: 'varchar',
                            placeholder: '#{sites-storages-fieldparams-addlink}',
                            note: '#{sites-storages-fieldparams-addlink-note}',
                            component: 'App.Modules.Lang.UI.TextArea',
                            default: ''
                        },
                        removelink: {
                            type: 'bool',
                            placeholder: '#{sites-storages-fieldparams-removelink}',
                            note: '#{sites-storages-fieldparams-removelink-note}',
                            component: 'Checkbox',
                            default: true
                        },
                        updownlink: {
                            type: 'bool',
                            placeholder: '#{sites-storages-fieldparams-updownlink}',
                            note: '#{sites-storages-fieldparams-updownlink-note}',
                            component: 'Checkbox',
                            default: true
                        },
                        hasscroll: { 
                            type: 'bool',
                            placeholder: '#{sites-storages-fieldparams-hasscroll}',
                            note: '#{sites-storages-fieldparams-hasscroll-note}',
                            component: 'Checkbox',
                            default: true
                        },
                        initempty: {
                            type: 'bool',
                            placeholder: '#{sites-storages-fieldparams-initempty}',
                            note: '#{sites-storages-fieldparams-initempty-note}',
                            component: 'Checkbox',
                            default: true
                        },
                        maxadd: {
                            type: 'int',
                            component: 'Number',
                            placeholder: '#{sites-storages-fieldparams-maxadd}',
                            note: '#{sites-storages-fieldparams-maxadd-note}',
                            default: ''
                        },
                        title: {
                            type: 'varchar',
                            component: 'TextArea',
                            placeholder: '#{sites-storages-fieldparams-title}',
                            note: '#{sites-storages-fieldparams-title-note}',
                            default: ''
                        },
                        removedesc: {
                            type: 'bool',
                            component: 'Checkbox',
                            placeholder: '#{sites-storages-fieldparams-removedesc}',
                            note: '#{sites-storages-fieldparams-removedesc-note}',
                            default: true
                        },
                        allow: {
                            type: 'varchar',
                            component: 'Text',
                            placeholder: '#{sites-storages-fieldparams-allow}',
                            note: '#{sites-storages-fieldparams-allow-note}',
                        },
                        size: {
                            type: 'int',
                            component: 'Number',
                            placeholder: '#{sites-storages-fieldparams-size}',
                            note: '#{sites-storages-fieldparams-allow-note}',
                        },
                        validate: {
                            component: 'Array',
                            desc: '#{sites-storages-fieldparams-validate}',
                            params: {
                                readonly: false, 
                                required: false,
                                vertical: true,
                                addlink: '#{sites-storages-fieldparams-validate-addlink}'
                            },
                            fields: {
                                message: {
                                    component: 'App.Modules.Lang.UI.TextArea',
                                    placeholder: '#{sites-storages-fieldparams-validate-message}'
                                },
                                method: {
                                    component: 'TextArea',
                                    placeholder: '#{sites-storages-fieldparams-validate-method}',
                                    default: '(field, validator) => { return true; /* false */ }'
                                },
                            }
                        },
                        valuegenerator: {
                            type: 'varchar',
                            placeholder: '#{sites-storages-fieldparams-valuegenerator}',
                            component: 'TextArea',
                            default: ''
                        },
                        onchangehandler: {
                            type: 'varchar',
                            placeholder: '#{sites-storages-fieldparams-onchangehandler}',
                            component: 'TextArea',
                            default: ''
                        },
                    }
                },
                lookup: {
                    type: 'json',
                    component: 'Object',
                    group: '#{sites-storages-fieldlookup-group}',
                    desc: '#{sites-storages-fieldlookup}',
                    note: '#{sites-storages-fieldlookup-note}',
                    params: {
                        vertical: true,
                    },
                    fields: {

                        _oneof: {
                            type: 'varchar',
                            component: 'Radio',
                            default: 'none',      
                            values: [{
                                value: 'none',
                                title: '#{sites-storages-fieldlookup-oneof-none}'
                            }, {
                                value: 'storage',
                                title: '#{sites-storages-fieldlookup-oneof-storage}'
                            }, {
                                value: 'accesspoint',
                                title: '#{sites-storages-fieldlookup-oneof-accesspoint}'
                            }, {
                                value: 'method',
                                title: '#{sites-storages-fieldlookup-oneof-method}'
                            }, {
                                value: 'binding',
                                title: '#{sites-storages-fieldlookup-oneof-binding}'
                            }, {
                                value: 'controller',
                                title: '#{sites-storages-fieldlookup-oneof-controller}'
                            }]                      
                        },

                        storage: {
                            type: 'json',
                            component: 'Object',
                            desc: '#{sites-storages-fieldlookup-storage}',
                            fields: {
                                name: {
                                    type: 'varchar',
                                    desc: '#{sites-storages-fieldlookup-storage-name}',
                                    component: 'Select',
                                    selector: {
                                        value: 'name',
                                        title: 'desc'
                                    },
                                    params: {
                                        readonly: false,
                                        searchable: false,
                                    },
                                    lookup: (term, dependsValue, dependsField, obj) => {
                                        return new Promise((rs, rj) => {
                                            console.log(moduleNode);
                                            Manage.Store.AsyncQuery('manage.storages').then((storages) => {
                                                rs({ 
                                                    result: Object.values(storages)
                                                        .filter((s => s.params.visible && s.module === moduleNode.name)) 
                                                });
                                            });
                                        });
                                    },
                                },
                                select: {
                                    type: 'varchar',
                                    component: 'Text',
                                    desc: '#{sites-storages-fieldlookup-storage-select}',
                                    note: '#{sites-storages-fieldlookup-storage-select-note}',
                                    default: '*'
                                },
                                title: {
                                    type: 'varchar',
                                    component: 'Text',
                                    desc: '#{sites-storages-fieldlookup-storage-title}',
                                    note: '#{sites-storages-fieldlookup-storage-title-note}',
                                },
                                value: {
                                    type: 'varchar',
                                    component: 'Text',
                                    desc: '#{sites-storages-fieldlookup-storage-value}',
                                    note: '#{sites-storages-fieldlookup-storage-value-note}',
                                },
                                group: {
                                    type: 'varchar',
                                    component: 'Text',
                                    desc: '#{sites-storages-fieldlookup-storage-group}',
                                    note: '#{sites-storages-fieldlookup-storage-group-note}',
                                },
                                order: {
                                    type: 'varchar',
                                    component: 'Text',
                                    desc: '#{sites-storages-fieldlookup-storage-order}',
                                    note: '#{sites-storages-fieldlookup-storage-order-note}'
                                },
                                limit: {
                                    type: 'bigint',
                                    component: 'Number',
                                    desc: '#{sites-storages-fieldlookup-storage-limit}',
                                    note: '#{sites-storages-fieldlookup-storage-limit-note}'
                                },
                                filter: {
                                    type: 'varchar',
                                    component: 'TextArea',
                                    desc: '#{sites-storages-fieldlookup-storage-filter}',
                                    note: '#{sites-storages-fieldlookup-storage-filter-note}'
                                },
                                depends: {
                                    type: 'varchar',
                                    component: 'Text',
                                    desc: '#{sites-storages-fieldlookup-storage-depends}',
                                    note: '#{sites-storages-fieldlookup-storage-depends-note}',
                                },
                                controller: {
                                    type: 'json',
                                    component: 'Object',
                                    desc: '#{sites-storages-fieldlookup-storage-controller}',
                                    note: '#{sites-storages-fieldlookup-storage-controller-note}',
                                    fields: {
                                        module: {
                                            type: 'varchar',
                                            component: 'Text',
                                            desc: '#{sites-storages-fieldlookup-storage-controller-module}',
                                            default: 'Manage'
                                        },
                                        class: {
                                            type: 'varchar',
                                            component: 'Text',
                                            desc: '#{sites-storages-fieldlookup-storage-controller-class}',
                                            default: 'Lookup'
                                        },
                                        method: {
                                            type: 'varchar',
                                            component: 'Text',
                                            desc: '#{sites-storages-fieldlookup-storage-controller-method}',
                                            default: 'Get'
                                        },
                                    }
                                }
                            },
                            params: {
                                vertical: true,
                                condition: {
                                    field: '_oneof',
                                    value: 'storage',
                                }
                            }
                            
                        },
                        controller: {
                            type: 'json',
                            component: 'Object',
                            desc: '#{sites-storages-fieldlookup-controller}',
                            fields: {
                                module: {
                                    type: 'varchar',
                                    component: 'Select',
                                    desc: '#{sites-storages-fieldlookup-controller-module}',
                                    default: 'Manage',
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
                                    },
                                    params: {
                                        readonly: false,
                                        searchable: false
                                    }
                                },
                                class: {
                                    type: 'varchar',
                                    component: 'Text',
                                    default: 'Lookup',
                                    desc: '#{sites-storages-fieldlookup-controller-class}'
                                },
                                method: {
                                    type: 'varchar',
                                    component: 'Text',
                                    default: 'Get',
                                    desc: '#{sites-storages-fieldlookup-controller-method}'
                                },
                                depends: {
                                    type: 'varchar',
                                    component: 'Text',
                                    desc: '#{sites-storages-fieldlookup-controller-depends}'
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
                            desc: '#{sites-storages-fieldlookup-binding}',
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
                            desc: '#{sites-storages-fieldlookup-method}',
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
                            desc: '#{sites-storages-fieldlookup-accesspoint}',
                            default: '',
                            fields: {
                                table:  { type: 'varchar', component: 'Text', default: '', desc: '#{sites-storages-fieldlookup-accesspoint-table}'},
                                fields: { type: 'varchar', component: 'Text', default: '', desc: '#{sites-storages-fieldlookup-accesspoint-fields}'},
                                filter:  { type: 'varchar', component: 'Text', default: '', desc: '#{sites-storages-fieldlookup-accesspoint-filter}'},
                                order: { type: 'varchar', component: 'Text', default: '', desc: '#{sites-storages-fieldlookup-accesspoint-order}'},
                            },
                            params: {
                                condition: {
                                    field: '_oneof',
                                    value: 'accesspoint',
                                }
                            }
                        },

                        depends: {
                            type: 'varchar',
                            component: 'Text',
                            desc: '#{sites-storages-fieldlookup-depends}',
                            default: '',
                            params: {
                                required: false,
                                readonly: false,
                            }
                        },
                    }
                },
                values: {
                    type: 'json',
                    component: 'Array',
                    group: '#{sites-storages-fieldvalues-group}',
                    desc: '#{sites-storages-fieldvalues}',
                    default: [],
                    params: {
                        vertical: true,
                        addlink: 'Добавить значение'
                    },
                    fields: {
                        title: {
                            type: 'varchar',
                            component: 'App.Modules.Lang.UI.Text',
                            desc: '#{sites-storages-fieldvalues-title}'
                        },
                        type: {
                            type: 'varchar',
                            component: 'Select',
                            desc: '#{sites-storages-fieldvalues-type}',
                            default: 'text',
                            attrs: {
                                width: 413
                            },
                            params: {
                                readonly: false,
                                searchable: false,
                                required: true,
                            },
                            values: [
                                {
                                    value: 'text',
                                    title: '#{sites-storages-fieldvalues-type-text}',
                                },
                                {
                                    value: 'number',
                                    title: '#{sites-storages-fieldvalues-type-number}',
                                }
                            ]
                        },
                        value: {
                            type: 'varchar',
                            component: 'Text',
                            desc: '#{sites-storages-fieldvalues-value}',
                            attrs: {
                                width: 410
                            }
                        }
                        
                        
                    }
                },
                selector: {
                    type: 'json',
                    group: '#{sites-storages-fieldselector-group}',
                    desc: '#{sites-storages-fieldselector}',
                    note: '#{sites-storages-fieldselector-note}',
                    component: 'Object',
                    params: {
                        vertical: true,
                    },
                    fields: {
                        value: {
                            type: 'varchar',
                            component: 'Text',
                            desc: '#{sites-storages-fieldselector-value}'
                        },
                        title: {
                            type: 'varchar',
                            component: 'Text',
                            desc: '#{sites-storages-fieldselector-title}'
                        },
                        group: {
                            type: 'varchar',
                            component: 'Text',
                            desc: '#{sites-storages-fieldselector-group-desc}'
                        },
                        __render: {
                            type: 'varchar',
                            component: 'TextArea',
                            desc: '#{sites-storages-fieldselector-render-desc}'
                        },
                        ondemand: {
                            type: 'bool',
                            component: 'Checkbox',
                            default: 0,
                            desc: '#{sites-storages-fieldselector-ondemand-desc}',
                        },
                        chooser: {
                            type: 'varchar',
                            component: 'Text',
                            desc: '#{sites-storages-fieldselector-chooser-desc}',
                        }
                    }
                }

                
            }
        };
        if(!showGroup) {
            delete fields.fields.group;
        }
        return fields;
    }

    _fieldVirtualFields() {
        const fields = {
            name: 'Field',
            desc: 'Свойство',
            fields: {
                name: {
                    type: 'varchar',
                    component: 'Text',
                    group: 'window',
                    desc: '#{sites-storages-fieldname}',
                    note: '#{sites-storages-fieldname-note}',
                    params: {
                        required: true,
                        validate: [{
                            message: '#{sites-storages-fieldname-validation-required}',
                            method: '(field, validator) => !!field.value'
                        }, {
                            message: '#{sites-storages-fieldname-validation-regexp}',
                            method: '(field, validator) => !/[^\\w\\d]/.test(field.value)'
                        }]
                    }
                },
                group_enabled: {
                    type: 'boolean',
                    component: 'Checkbox',
                    placeholder: '#{sites-storages-fieldgroupenabled}',
                    group: 'window',
                    default: false,
                    params: {
                        required: true,
                    }
                },
                group: {
                    type: 'varchar',
                    component: 'App.Modules.Lang.UI.Text',
                    group: 'window',
                    desc: '#{sites-storages-fieldgroup}',
                    note: '#{sites-storages-fieldgroup-note}',
                    default: 'window',
                    params: {
                        required: true,
                        validate: [{
                            message: '#{sites-storages-fieldgroup-validation-required}',
                            method: '(field, validator) => !!field.value'
                        }]
                    }
                },
                desc: {
                    type: 'varchar',
                    component: 'App.Modules.Lang.UI.TextArea',
                    group: 'window',
                    desc: '#{sites-storages-fielddesc}',
                    note: '#{sites-storages-fielddesc-note}',
                    params: {
                        required: true,
                        validate: [{
                            message: '#{sites-storages-fielddesc-validation-required}',
                            method: '(field, validator) => !!field.value'
                        }]
                    }
                },
                type: {
                    type: 'varchar',
                    component: 'Text',
                    group: 'window',
                    desc: '#{sites-storages-fieldtype}',
                    note: '#{sites-storages-fieldtype-note}',
                    params: {
                        required: true,
                        validate: [{
                            message: '#{sites-storages-fieldtype-validation-required}',
                            method: '(field, validator) => !!field.value'
                        }]
                    }
                },
                length: {
                    type: 'integer',
                    component: 'Number',
                    group: 'window',
                    desc: '#{sites-storages-fieldlength}',
                    note: '#{sites-storages-fieldlength-note}',
                    params: {
                        required: false,
                    }
                },
                class: {
                    type: 'varchar',
                    component: 'Text',
                    group: 'window',
                    desc: '#{sites-storages-fieldclass}',
                    note: '#{sites-storages-fieldclass-note}',
                    params: {
                        required: true,
                        validate: [{
                            message: '#{sites-storages-fieldclass-validation-required}',
                            method: '(field, validator) => !!field.value'
                        }]
                    }
                },
                
                expression: {
                    type: 'varchar',
                    group: 'window',
                    component: 'TextArea',
                    desc: '#{sites-storages-fieldexpression}',
                    note: '#{sites-storages-fieldexpression-note}'
                },
                
                params: {
                    type: 'json',
                    component: 'Object',
                    group: 'window',
                    desc: '#{sites-storages-fieldparams}',
                    params: {
                        vertical: true,
                    },
                    fields: {
                        list: {
                            type: 'bool',
                            placeholder: '#{sites-storages-fieldparams-list}',
                            component: 'Checkbox',
                            default: false
                        },
                        greed: {
                            type: 'varchar',
                            placeholder: '#{sites-storages-fieldparams-greed}',
                            note: '#{sites-storages-fieldparams-greed-note}',
                            component: 'Text',
                            default: ''
                        },
                        viewer: {
                            type: 'varchar',
                            placeholder: '#{sites-storages-fieldparams-viewer}',
                            note: '#{sites-storages-fieldparams-viewer-note}',
                            component: 'Select',
                            default: '',
                            selector: {
                                value: 'value',
                                title: 'title'
                            },
                            params: {
                                readonly: false,
                                searchable: false,
                            },
                            lookup:  () => new Promise((resolve, reject) => {
                                resolve(Colibri.UI.Viewer.Enum().map(v => { return {value: v.value, title: v.value + ' ' + v.title}; }));
                            })
                        },
                    }
                },
                
            }
        };
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
                    desc: '#{sites-storages-indexname}',
                    note: '#{sites-storages-indexname-note}',
                    params: {
                        required: true,
                        validate: [{
                            message: '#{sites-storages-indexname-validation-required}',
                            method: '(field, validator) => !!field.value'
                        }, {
                            message: '#{sites-storages-indexname-validation-regexp}',
                            method: '(field, validator) => !/[^\\w\\d]/.test(field.value)'
                        }]
                    }
                },
                fields: {
                    type: 'varchar',
                    component: 'Select',
                    multiple: true,
                    desc: '#{sites-storages-indexfields}',
                    note: '#{sites-storages-indexfields-note}',
                    lookup: () => {
                        return new Promise((rs, rj) => {
                            Manage.Store.AsyncQuery('manage.storages(' + storageName + ')').then((storage) => {
                                const components = [];
                                Object.forEach(storage.fields, (name, field) => {
                                    if(['json'].indexOf(field.type)) {
                                        components.push({ value: name, title: (field.desc[Lang.Current] ?? field.desc) + ' (' + name + ')' });
                                    }
                                });
                                rs({ result: components });
                            });
                        });
                    },
                    params: {
                        required: true,
                        searchable: false,
                        readonly: false,
                        validate: [{
                            message: '#{sites-storages-indexfields-validation-required}',
                            method: '(field, validator) => !!field.value'
                        }]
                    }
                },
                type: {
                    type: 'varchar',
                    component: 'Select',
                    desc: '#{sites-storages-indextype}',
                    note: '#{sites-storages-indextype-note}',
                    params: {
                        required: true,
                        searchable: false,
                        readonly: false,
                        validate: [{
                            message: '#{sites-storages-indextype-validation-required}',
                            method: '(field, validator) => !!field.value'
                        }]
                    },
                    default: 'NORMAL',
                    values: [
                        {value: 'FULLTEXT', title: '#{sites-storages-indextype-fulltext}'},
                        {value: 'NORMAL', title: '#{sites-storages-indextype-normal}'},
                        {value: 'SPATIAL', title: '#{sites-storages-indextype-spatial}'},
                        {value: 'UNIQUE', title: '#{sites-storages-indextype-unique}'},
                    ]
                },
                method: {
                    type: 'varchar',
                    component: 'Select',
                    desc: '#{sites-storages-indexmethod}',
                    note: '#{sites-storages-indexmethod-note}',
                    default: 'BTREE',
                    values: [
                        {value: 'BTREE', title: '#{sites-storages-values-binary}'},
                        {value: 'HASH', title: '#{sites-storages-values-hash}'},
                    ],
                    params: {
                        required: true,
                        searchable: false,
                        readonly: false,
                        validate: [{
                            message: '#{sites-storages-indexmethod-validation-required}',
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

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
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
            const moduleNode = this._modules.selected; // node.FindParent((node) => node.tag.type === 'module');
            if (Security.IsCommandAllowed('sites.storages.add')) {
                Manage.FormWindow.Show('#{sites-storages-windowtitle-newstorage}', 800, this._storageFields(), {})
                    .then((data) => {
                        Sites.SaveStorage(moduleNode.value, data);
                    })
                    .catch(() => { });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storagespage-notallowed}', Colibri.UI.Notice.Error, 5000));
            }
        }
        else if (menuData.name == 'edit-storage') {
            const moduleNode = this._modules.selected; // node.FindParent((node) => node.tag.type === 'module');
            if (Security.IsCommandAllowed('sites.storages.edit')) {
                const storageData = node.tag.entry;
                if(storageData.group) {
                    storageData.group_enabled = true;
                }
                console.log(storageData);
                Manage.FormWindow.Show('#{sites-storages-windowtitle-editstorage}', 800, this._storageFields(), storageData)
                    .then((data) => {
                        Sites.SaveStorage(moduleNode.value, data);
                    })
                    .catch(() => { });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storagespage-notallowed}', Colibri.UI.Notice.Error, 5000));
            }

        }
        else if (menuData.name == 'remove-storage') {
            const moduleNode = this._modules.selected; // node.FindParent((node) => node.tag.type === 'module');
            App.Confirm.Show('#{sites-storages-messages-removestorage}', '#{sites-storages-messages-removestoragemessage}', '#{sites-storages-messages-removestoragemessage-delete}').then(() => {
                Sites.DeleteStorage(moduleNode.value, node.tag.entry);
            });
        }
        else if (menuData.name == 'copy-field') {
            if(node.tag.type === 'field') {
                this._copiedField = node.tag.entry;
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storagespage-fieldcopied}', Colibri.UI.Notice.Success, 5000));
            }
        }
        else if (menuData.name == 'paste-field') {
            const data = this._copiedField;
            const moduleNode = this._modules.selected; // node.FindParent((node) => node.tag.type === 'module');
            const storageNode = node.FindParent((node) => node.tag.type === 'storage');
            Sites.SaveField(moduleNode.value, storageNode.tag.entry, this._getPath(node, data.name), data, true).then((response) => {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storagespage-fieldpasted}', Colibri.UI.Notice.Success, 5000));
                this._copiedField = null;
            });
        }
        else if (menuData.name == 'new-field') {
            const moduleNode = this._modules.selected; // node.FindParent((node) => node.tag.type === 'module');
            const storageNode = node.FindParent((node) => node.tag.type === 'storage');
            if (Security.IsCommandAllowed('sites.storages.' + storageNode.tag.entry.name + '.fields')) { // node.tag.type === 'fields'
                Manage.FormWindow.Show('#{sites-storages-windowtitle-newproperty}', 1024, this._fieldFields(true, moduleNode.value), {})
                    .then((data) => {
                        Sites.SaveField(moduleNode.value, storageNode.tag.entry, this._getPath(node, data.name), data, true);
                    })
                    .catch(() => { });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storagespage-notallowed}', Colibri.UI.Notice.Error, 5000));
            }
        }
        else if (menuData.name == 'new-virtual-field') {
            const moduleNode = this._modules.selected; // node.FindParent((node) => node.tag.type === 'module');
            const storageNode = node.FindParent((node) => node.tag.type === 'storage');
            if (Security.IsCommandAllowed('sites.storages.' + storageNode.tag.entry.name + '.fields')) {
                Manage.FormWindow.Show('#{sites-storages-windowtitle-newvirtualproperty}', 1024, this._fieldVirtualFields(), {})
                    .then((data) => {
                        data.virtual = true;
                        Sites.SaveField(moduleNode.value, storageNode.tag.entry, this._getPath(node, data.name), data, true);
                    })
                    .catch(() => { });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storagespage-notallowed}', Colibri.UI.Notice.Error, 5000));
            }
        }
        else if (menuData.name == 'edit-field') {
            const moduleNode = this._modules.selected; // node.FindParent((node) => node.tag.type === 'module');
            const storageNode = node.FindParent((node) => node.tag.type === 'storage');
            if (Security.IsCommandAllowed('sites.storages.' + storageNode.tag.entry.name + '.fields')) {
                
                const fieldData = node.tag.entry;
                if(fieldData.default) {
                    fieldData.hasdefault = true;
                }

                if(fieldData.group && fieldData.group !== 'window') {
                    fieldData.group_enabled = true;
                }

                // node.parentNode.tag.type === 'fields'
                Manage.FormWindow.Show('#{sites-storages-windowtitle-editproperty}', 1024, fieldData.virtual ? this._fieldVirtualFields(moduleNode.value) : this._fieldFields(true, moduleNode.value), fieldData)
                    .then((data) => {
                        Sites.SaveField(moduleNode.value, storageNode.tag.entry, this._getPath(node), data, false);
                    })
                    .catch(() => { });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storagespage-notallowed}', Colibri.UI.Notice.Error, 5000));
            }

        }
        else if (menuData.name == 'remove-field') {
            const moduleNode = this._modules.selected; // node.FindParent((node) => node.tag.type === 'module');
            const storageNode = node.FindParent((node) => node.tag.type === 'storage');
            const selectedNode = this.selected;
            if (Security.IsCommandAllowed('sites.storages.' + storageNode.tag.entry.name + '.fields')) {
                App.Confirm.Show('#{sites-storages-messages-removeproperty}', '#{sites-storages-messages-removepropertymessage}', '#{sites-storages-messages-removepropertymessage-delete}').then(() => {
                    Sites.DeleteField(moduleNode.value, storageNode.tag.entry, this._getPath(node));
                });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storagespage-notallowed}', Colibri.UI.Notice.Error, 5000));
            }

        }
        else if (menuData.name == 'new-index') {
            const moduleNode = this._modules.selected; // node.FindParent((node) => node.tag.type === 'module');
            const storageNode = node.FindParent((node) => node.tag.type === 'storage');
            if (Security.IsCommandAllowed('sites.storages.' + storageNode.tag.entry.name + '.indexes')) {
                Manage.FormWindow.Show('#{sites-storages-windowtitle-newindex}', 800, this._fieldIndex(storageNode.tag.entry.name), {})
                    .then((data) => {
                        Sites.SaveIndex(moduleNode.value, storageNode.tag.entry, data);
                    })
                    .catch(() => { });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storagespage-notallowed}', Colibri.UI.Notice.Error, 5000));
            }
        }
        else if (menuData.name == 'edit-index') {
            const moduleNode = this._modules.selected; // node.FindParent((node) => node.tag.type === 'module');
            const storageNode = node.FindParent((node) => node.tag.type === 'storage');
            if (Security.IsCommandAllowed('sites.storages.' + storageNode.tag.entry.name + '.indexes')) {
                Manage.FormWindow.Show('#{sites-storages-windowtitle-editindex}', 800, this._fieldIndex(storageNode.tag.entry.name), node.tag.entry)
                    .then((data) => {
                        Sites.SaveIndex(moduleNode.value, storageNode.tag.entry, data);
                    })
                    .catch(() => { });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storagespage-notallowed}', Colibri.UI.Notice.Error, 5000));
            }

        }
        else if (menuData.name == 'remove-index') {
            const moduleNode = this._modules.selected; // node.FindParent((node) => node.tag.type === 'module');
            const storageNode = node.FindParent((node) => node.tag.type === 'storage');
            if (Security.IsCommandAllowed('sites.storages.' + storageNode.tag.entry.name + '.fields')) {
                App.Confirm.Show('#{sites-storages-messages-removeindex}', '#{sites-storages-messages-removeindexmessage}', '#{sites-storages-messages-removeindexmessage-delete}').then(() => {
                    Sites.DeleteIndex(moduleNode.value, storageNode.tag.entry, node.tag.entry);
                });
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storagespage-notallowed}', Colibri.UI.Notice.Error, 5000));
            }

        }
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
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

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
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

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __dragDropComplete(event, args) {
        
        const dragged = args.dragged;
        const droppedTo = args.droppedTo;
        const droppedToElement = args.droppedToElement;
        const dropSibling = droppedToElement.attr('drop');

        const moduleNode = this._modules.selected; // dragged.FindParent((node) => node.tag.type === 'module');
        const storageNode = dragged.FindParent((node) => node.tag.type === 'storage');

        Sites.MoveField(moduleNode.value, storageNode.tag.entry, this._getPath(dragged), this._getPath(droppedTo), dropSibling);

    }


}