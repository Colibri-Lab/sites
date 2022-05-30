App.Modules.Sites.DataGrid = class extends Colibri.UI.Grid {

    set storage(value) {
        this._storageChanged = this._storage?.name != value.name;
        this._storage = value;
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

        if(this._storage && this._storage.fields && this._storageChanged) {
                
            let idColumn = this.header.columns.Children('id');
            if(!idColumn) {
                idColumn = this.header.columns.Add('id', '#', {width: '5%'});
                idColumn.resizable = true;
                idColumn.sortable = true;
            }
            
            let dateCreatedColumn = this.header.columns.Children('datecreated');
            if(!dateCreatedColumn) {
                dateCreatedColumn = this.header.columns.Add('datecreated', '#{sites-structure-datagrid-created;Дата создания}', {width: '10%'});
                dateCreatedColumn.viewer = 'Colibri.UI.DateTimeViewer';
                dateCreatedColumn.resizable = true;
                dateCreatedColumn.sortable = true;
            }

            Object.forEach(this._storage.fields, (name, field, index) => {
                if(field.params?.list !== true) {
                    return true;
                }
                let column = this.header.columns.Children(name);
                if(!column) {
                    column = this.header.columns.Add(name, field.desc); // , {width: (85/columnCount).toFixed(2) + '%'}
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