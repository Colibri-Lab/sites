App.Modules.Sites.DataGrid = class extends Colibri.UI.Grid {

    constructor(name, container) {
        super(name, container);
        this.AddClass('app-manager-datagrid-component');

        this.AddHandler('ColumnClicked', this.__clickOnDataColumn);
        
        this.AddHandler('ColumnContextMenu', this.__thisColumnContextMenu);
        this.AddHandler('ColumnContextMenuItemClicked', this.__thisColumnContextMenuItemClicked);

        this.AddHandler('CustomContextMenuButtonClicked', this.__thisCustomContextMenuButtonClicked);
        this.AddHandler('CustomContextMenuButtonContextMenuItemClicked', this.__thisCustomContextMenuButtonContextMenuItemClicked);

        this._sortData = {name: '', order: ''};

    }

    __thisColumnContextMenu(event, args) {
        if(args.column.name === 'empty') {
            return false;
        }

        const contextmenu = [];
        if (args.column.shown) {
            contextmenu.push({ name: 'hide', title: '#{sites-structure-datagrid-column-hide}' });
        } else {
            contextmenu.push({ name: 'restore', title: '#{sites-structure-datagrid-column-restore}' });
        }
        args.column.contextmenu = contextmenu;
        args.column.ShowContextMenu([Colibri.UI.ContextMenu.LB, Colibri.UI.ContextMenu.LT], '', { left: args.domEvent.clientX, top: args.domEvent.clientY });
        args.domEvent.stopPropagation();
        args.domEvent.preventDefault();
        return false;
    }

    
    __thisColumnContextMenuItemClicked(event, args) {
        if (args.menuData?.name === 'hide') {
            args.column.Hide();
        } else if (args.menuData?.name === 'restore') {
            args.column.Show();
        } else if (args.menuData?.name === 'restore-all') {
            Object.forEach(this.header.FindAllColumns(), (nameColumn, column) => {
                column.Show();
            });
        }
        this._renderCustomContextMenuIfNeeded();
        this.Dispatch('Scrolled');
    }

    __thisCustomContextMenuButtonClicked(event, args) {
        const contextmenu = [];
        Object.forEach(this.header.FindAllColumns(), (nameColumn, column) => {
            if (!column.shown) {
                contextmenu.push({name: column.name, title: column.value});
            }
        });
        contextmenu.push({name: 'separator'});
        contextmenu.push({ name: 'restore-all', title: '#{sites-structure-datagrid-column-restore-all}' });
     
        args.icon.contextmenu = contextmenu;
        args.icon.ShowContextMenu([Colibri.UI.ContextMenu.RB, Colibri.UI.ContextMenu.RT]);

        this._renderCustomContextMenuIfNeeded();

    }

    __thisCustomContextMenuButtonContextMenuItemClicked(event, args) {
        if (args.menuData?.name === 'restore-all') {
            Object.forEach(this.header.FindAllColumns(), (nameColumn, column) => {
                column.Show();
            });
        } else {
            Object.forEach(this.header.FindAllColumns(), (nameColumn, column) => {
                if(column.name === args.menuData?.name) {
                    column.Show();
                }
            });
        }
        this._renderCustomContextMenuIfNeeded();
    }

    _renderCustomContextMenuIfNeeded() {
       
        const hiddenColumns = [];
        Object.forEach(this.header.FindAllColumns(), (nameColumn, column) => {
            if (!column.shown) {
                hiddenColumns.push(column.name);
            }
        });

        if (hiddenColumns.length > 0) {
            this.AddCustomContextMenuButton('Colibri.UI.BookIcon', this.top - this.parent.top + 10, 10);
        } else {
            this.RemoveCustomContextMenuButton();
        }

        this._hiddenColumns = hiddenColumns;
        if(this._storageObject) {
            App.Browser.Set('columns-' + this._storageObject.name, JSON.stringify(this._hiddenColumns));
        }

    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __clickOnDataColumn(event, args) {
        this._sortChanged = JSON.stringify(this._sortData) != JSON.stringify({name: this.sortColumn?.name, order: this.sortOrder});
        this._sortData = {name: this.sortColumn?.name, order: this.sortOrder};
    }

    set storage(value) {
        if(value === null) {
            this._storageChanged = true;
            this._storageObject = null;    
        }
        else {
            this._storageChanged = this._storageObject?.name != value.name;
            this._storageObject = value;
        }
    }

    get storage() {
        return this._storageObject;
    }

    set value(value) {
        this.__renderBoundedValues(value);
    }

    get value() {
        return super.value;
    }

    /**
     * Clear on every change of rows
     * @type {Boolean}
     */
    get clearOnChange() {
        return this._clearOnChange;
    }
    /**
     * Clear on every change of rows
     * @type {Boolean}
     */
    set clearOnChange(value) {
        value = this._convertProperty('Boolean', value);
        this._clearOnChange = value;
    }
    

    /**
     * Render bounded to component data
     * @protected
     * @param {*} data 
     * @param {String} path 
     */
    __renderBoundedValues(data, path) {

        if(!data) {
            data = [];
        }
        else if(Object.isObject(data)) {
            data = Object.values(data);
        }

        if(this._storageChanged) {
            this.ResetSort();
            this.ClearAll();
        }

        if(this._sortChanged) {
            this.ClearAllRows();
            this._sortChanged = false;
        }

        if(this._clearOnChange) {
            this.ClearAllRows();
        }

        if(this._storageObject && this._storageObject?.fields && this._storageChanged) {
            const columnsHidden = JSON.parse(App.Browser.Get('columns-' + this._storageObject.name));

            let idColumn = this.header.columns.Children('id');
            if(!idColumn) {
                idColumn = this.header.columns.Add('id', '#', {width: 50});
                idColumn.resizable = true;
                idColumn.sortable = true;
                if(columnsHidden?.indexOf('id') > -1) {
                    idColumn.Hide();
                }
            }
            
            let dateCreatedColumn = this.header.columns.Children('datecreated');
            if(!dateCreatedColumn) {
                dateCreatedColumn = this.header.columns.Add('datecreated', '#{sites-structure-datagrid-created}', {width: 120});
                dateCreatedColumn.viewer = 'Colibri.UI.DateTimeViewer';
                dateCreatedColumn.resizable = true;
                dateCreatedColumn.sortable = true;
                if(columnsHidden?.indexOf('datecreated') > -1) {
                    dateCreatedColumn.Hide();
                }
            }

            if(this._storageObject.params.softdeletes && this._storageObject.params.deletedautoshow) {
                let dateDeletedColumn = this.header.columns.Children('datedeleted');
                if(!dateDeletedColumn) {
                    dateDeletedColumn = this.header.columns.Add('datedeleted', '#{sites-structure-datagrid-deleted}', {width: 120});
                    dateDeletedColumn.viewer = 'Colibri.UI.DateTimeViewer';
                    dateDeletedColumn.resizable = true;
                    dateDeletedColumn.sortable = true;
                    if(columnsHidden?.indexOf('datedeleted') > -1) {
                        dateDeletedColumn.Hide();
                    }
                }   
            }

            const intemplate = {};
            let column = null;
            Object.forEach(this._storageObject.fields, (name, field, index) => {
                if(field.params?.template === true) {
                    intemplate[name] = field;
                }
                if(field.params?.list !== true) {
                    return true;
                }
                column = this.header.columns.Children(name);
                if(!column) {
                    column = this.header.columns.Add(name, (field.desc ?? field.placeholder)[Lang.Current] ?? (field.desc ?? field.placeholder) ?? ''); // , {width: (85/columnCount).toFixed(2) + '%'}
                    if(field.params?.greed) {
                        column.width = field.params?.greed;
                    }
                    if(field.params?.visual) {
                        column.viewer = 'Colibri.UI.HtmlDataViewer';
                    }
                    else if(field.params?.viewer) {
                        column.viewer = field.params?.viewer;
                    }
                    column.tag = field;
                    if(field.params?.render) {
                        column.tag.params = {render: eval(field.params?.render)};
                    }
                    if(field.attrs) {
                        if(field.attrs.width) {
                            column.width = field.attrs.width;
                        }
                        if(field.attrs.height) {
                            column.height = field.attrs.height;
                        }
                        if(field.attrs.class) {
                            column.AddClass(field.attrs.class);
                        }
                    }
                    column.resizable = true;
                    column.sortable = true;
                    // column.minWidth = 150;
                }
                if(columnsHidden?.indexOf(name) > -1) {
                    column.Hide();
                }
                return true;
            });

            if(Object.countKeys(intemplate) > 0) {
                this.rowTemplateComponent = 'App.Modules.Sites.UI.DataGridRowTemplateComponent';
                Object.forEach(this._storageObject.params.template_args, (key, val) => !val ? (delete this._storageObject.params.template_args[key]) : null);
                this.rowTemplateAttrs = Object.assign({rows: 'max-content', columns: 3, orientation: 'hr', gap: '0px 0px', flow: 'row'}, this._storageObject.params.template_args, {fields: intemplate});
            } else {
                this.rowTemplateComponent = null;
            }

            column.resizable = false;

        }

        let found = [];
        data.forEach((d) => {
            found.push('data' + d.id);
            let row = this.FindRow('data' + d.id);
            if(!row) {
                this.rows.Add('data' + d.id, d);
            }
            else {
                row.value = d;
            }
        });

        this.ForEveryRow((name, row) => {
            if(found.indexOf(name) === -1) {
                row.Dispose();
            }
        });

        this.rows.title = '';
        this._storageChanged = false;

        this._renderCustomContextMenuIfNeeded();


    }
}