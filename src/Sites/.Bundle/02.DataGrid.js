App.Modules.Sites.DataGrid = class extends Colibri.UI.Grid {

    set storage(value) {
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

        if(data.length == 0) {
            this.ClearAll();
        }

        if(!this._storage || !this._storage.fields) {
            return;
        }

        this.header.columns.Children('firstChild').width = '2%';
        let idColumn = this.header.columns.Children('id');
        if(!idColumn) {
            idColumn = this.header.columns.Add('id', '#', {width: '5%'});
        }
        let dateCreatedColumn = this.header.columns.Children('datecreated');
        if(!dateCreatedColumn) {
            dateCreatedColumn = this.header.columns.Add('datecreated', 'Дата создания', {width: '10%'});
            dateCreatedColumn.viewer = 'Colibri.UI.DateTimeViewer';
        }

        const columnCount = Object.countKeys(this._storage.fields);
        Object.forEach(this._storage.fields, (name, field) => {
            if(field.params?.list !== true) {
                return true;
            }
            let column = this.header.columns.Children(name);
            if(!column) {
                column = this.header.columns.Add(name, field.desc, {width: (83/columnCount) + '%'});
                if(field.params?.viewer) {
                    column.viewer = field.params?.viewer;
                }
                if(field.params?.render) {
                    column.tag.params = {render: eval(field.params?.render)};
                }
            }
            return true;
        });
        

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

    }
}