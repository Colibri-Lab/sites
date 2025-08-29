App.Modules.Sites.DataGrid = class extends Colibri.UI.Grid {

    constructor(name, container) {
        super(name, container);
        this.AddClass('app-manager-datagrid-component');

        this.AddHandler('ColumnClicked', this.__clickOnDataColumn);
        this._sortData = {name: '', order: ''};
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
                
            let idColumn = this.header.columns.Children('id');
            if(!idColumn) {
                idColumn = this.header.columns.Add('id', '#', {width: '5%'});
                idColumn.resizable = true;
                idColumn.sortable = true;
            }
            
            let dateCreatedColumn = this.header.columns.Children('datecreated');
            if(!dateCreatedColumn) {
                dateCreatedColumn = this.header.columns.Add('datecreated', '#{sites-structure-datagrid-created}', {width: '10%'});
                dateCreatedColumn.viewer = 'Colibri.UI.DateTimeViewer';
                dateCreatedColumn.resizable = true;
                dateCreatedColumn.sortable = true;
            }

            if(this._storageObject.params.softdeletes && this._storageObject.params.deletedautoshow) {
                let dateDeletedColumn = this.header.columns.Children('datedeleted');
                if(!dateDeletedColumn) {
                    dateDeletedColumn = this.header.columns.Add('datedeleted', '#{sites-structure-datagrid-deleted}', {width: '10%'});
                    dateDeletedColumn.viewer = 'Colibri.UI.DateTimeViewer';
                    dateDeletedColumn.resizable = true;
                    dateDeletedColumn.sortable = true;
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
                    column = this.header.columns.Add(name, field.desc[Lang.Current] ?? field.desc ?? ''); // , {width: (85/columnCount).toFixed(2) + '%'}
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
                    column.resizable = true;
                    column.sortable = true;
                    // column.minWidth = 150;
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

    }
}