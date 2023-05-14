App.Modules.Sites.DataGrid = class extends Colibri.UI.Grid {

    constructor(name, container) {
        super(name, container);
        this.AddClass('app-manager-datagrid-component')
    }

    set storage(value) {
        if(value === null) {
            this._storageChanged = true;
            this._storage = null;    
        }
        else {
            this._storageChanged = this._storage?.name != value.name;
            this._storage = value;
        }
    }

    get storage() {
        return this._storage;
    }

    set value(value) {
        this.__renderBoundedValues(value);
    }

    get value() {
        return super.value;
    }
    
    __renderBoundedValues(data) {

        if(!data) {
            data = [];
        }
        else if(!Array.isArray(data) && data instanceof Object) {
            data = Object.values(data);
        }

        if(this._storageChanged) {
            this.ResetSort();
            this.ClearAll();
        }

        if(data.length == 0) {
            this.ClearAllRows();
        }

        if(this._storage && this._storage?.fields && this._storageChanged) {
                
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

            const intemplate = {};

            Object.forEach(this._storage.fields, (name, field, index) => {
                if(field.params?.template === true) {
                    intemplate[name] = field;
                }
                if(field.params?.list !== true) {
                    return true;
                }
                let column = this.header.columns.Children(name);
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
                }
                return true;
            });

            if(Object.countKeys(intemplate) > 0) {
                this.rowTemplateComponent = 'App.Modules.Sites.UI.DataGridRowTemplateComponent';
                this.rowTemplateAttrs = Object.assign({fields: intemplate}, {rows: 'max-content', columns: 3, orientation: 'hr', gap: '0px 0px', flow: 'row'}, this._storage.params.template_args);
            } else {
                this.rowTemplateComponent = null;
            }

            this.header.columns.Children('lastChild').resizable = false;

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