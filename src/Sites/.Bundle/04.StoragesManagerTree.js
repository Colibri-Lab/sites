App.Modules.Sites.StoragesManagerTree = class extends Colibri.UI.Tree {
    
    

    constructor(name, container) {
        super(name, container);
        this.AddClass('app-manager-tree-component');
        this._foldersList = [];
        this._names = new Map();
        this.removeHiddenNodes = true;
    }

    _searchForFieldIcon(field) {
    
        let icon = '';
        Object.forEach(Colibri.UI.Forms.Field.Components, (name, value) => {
            if(value.className === field.component) {
                icon = value.icon;
            }
        });

        if(!icon) {
            icon = Colibri.UI.FieldIcons['Colibri.UI.Forms.Text'];
        }

        return icon;
        
    }

    _insertModuleNode(module) {
        let moduleNode = this.FindNode(module.name);
        if(!moduleNode) {
            moduleNode = this.nodes.Add(module.name);
            moduleNode.text = module.desc + ' (' + module.name + ')';
            moduleNode.icon = App.Modules.Sites.Icons.ModuleIcon;
            moduleNode.tag.entry = module;
            moduleNode.tag.type = 'module';
            moduleNode.isLeaf = true;
        }
        return moduleNode;
    }

    _insertStorageNode(storageNode, storage) {


        this._names.set(storage.name + '_fields', storage.name + '_fields');
        let fieldsNode = this.FindNode(storage.name + '_fields');
        if(!fieldsNode) {
            fieldsNode = storageNode.nodes.Add(storage.name + '_fields');
        }
        fieldsNode.text = '#{sites-storages-fields}';
        fieldsNode.isLeaf = Object.countKeys(storage.fields) == 0;
        fieldsNode.icon = App.Modules.Sites.Icons.FieldsIcon;
        fieldsNode.tag.entry = null;
        fieldsNode.tag.type = 'fields';
        
        this._insertFieldFields(fieldsNode, storage);

        if(storage.dbms === 'relational') {

            this._names.set(storage.name + '_indices', storage.name + '_indices');
            let indicesNode = this.FindNode(storage.name + '_indices');
            if(!indicesNode) {
                indicesNode = storageNode.nodes.Add(storage.name + '_indices');
            }
            indicesNode.text = '#{sites-storages-indices}';
            indicesNode.isLeaf = !storage.indices || Object.countKeys(storage.indices) == 0;
            indicesNode.icon = App.Modules.Sites.Icons.IndexesIcon;
            indicesNode.tag.entry = null;
            indicesNode.tag.type = 'indices';
    
            this._insertFieldIndexes(indicesNode, storage);
        }

       

        // moduleNode.isLeaf = false;

        return storageNode;
    }

    _insertFieldNode(storageNode, name, field, index) {
        field.name = name;
        this._names.set(storageNode.name + '_' + name, storageNode.name + '_' + name);
        let fieldNode = this.FindNode(storageNode.name + '_' + name);
        if(!fieldNode) {
            fieldNode = storageNode.nodes.Add(storageNode.name + '_' + name, index);
        }
        else {
            storageNode.nodes.Move(fieldNode, index);
        }

        let desc = field.desc;
        try { desc = (field.desc[Lang.Current] ?? field.desc); } catch(e) {}
        if(!desc) {
            desc = '';
        }

        if(!desc && field.placeholder) {
            try { desc = (field.placeholder[Lang.Current] ?? field.placeholder); } catch(e) {}
            if(!desc) {
                desc = '';
            }
        }

        fieldNode.text = '<span class="ellipsis">' + desc + '</span>' +  
            ' (<span class="fieldname">' + name + '</span>' + (field?.params?.list ? ', <span class="inlist">inlist</span>' : '') +
            (field?.params?.template ? ', <span class="intemplate">intemplate</span>' : '') + 
            (field?.params?.greed ? ', <span class="greed">' + field?.params?.greed + '</span>' : '') + 
            (field?.params?.viewer ? ', <span class="viewer">' + field?.params?.viewer + '</span>' : '') + 
            (!!field?.params?.valuegenerator ? ', <span class="calculatable">calc</span>' : '') + 
            (!!field?.params?.onchangehandler ? ', <span class="calculatable">change</span>' : '') + 
            (!!field?.params?.fieldgenerator ? ', <span class="calculatable">fieldgen</span>' : '') + 
            (!!field?.params?.generator ? ', <span class="calculatable">gen</span>' : '') + 
        ')';

        fieldNode.isLeaf = !field.fields || Object.countKeys(field.fields) == 0;
        fieldNode.icon = this._searchForFieldIcon(field);
        fieldNode.tag.entry = field;
        fieldNode.tag.type = 'field';
        return fieldNode;
    }

    _insertIndexNode(storageNode, name, index) {
        index.name = name;
        this._names.set(storageNode.name + '_' + name, storageNode.name + '_' + name);
        let fieldNode = this.FindNode(storageNode.name + '_' + name);
        if(!fieldNode) {
            fieldNode = storageNode.nodes.Add(storageNode.name + '_' + name);
        }
        fieldNode.text = name + ' (' + index.fields.join(', ') + ', <span class="type">' + index.type + '</span>, <span class="method">' + index.method + '</span>)';
        fieldNode.icon = App.Modules.Sites.Icons.IndexIcon;
        fieldNode.tag.entry = index;
        fieldNode.tag.type = 'index';
        return fieldNode;
    }

    _insertFieldFields(storageNode, storage) {
        if(!storage.fields) {
            return;
        }
        const founds = [];
        Object.forEach(storage.fields, (name, field, index) => {
            const fieldNode = this._insertFieldNode(storageNode, name, field, index);
            founds.push(fieldNode.name);
            this._insertFieldFields(fieldNode, field);
        });

        storageNode.nodes.ForEach((name, node) => {
            if(founds.indexOf(name) === -1) {
                node.Dispose();
            }
        });

    }

    _insertFieldIndexes(storageNode, storage) {
        if(!storage.fields) {
            return;
        }

        const founds = [];
        Object.forEach(storage.indices, (name, index) => {
            const indexNode = this._insertIndexNode(storageNode, name, index);
            founds.push(indexNode.name);
        });
        storageNode.nodes.ForEach((name, node) => {
            if(founds.indexOf(name) === -1) {
                node.Dispose();
            }
        });
    }


    /**
     * Render bounded to component data
     * @protected
     * @param {*} data 
     * @param {String} path 
     */
    __renderBoundedValues(data, path) {
        if(!data) {
            this.nodes.Clear();
            return;
        }

        if(Object.countKeys(data) === 0) {
            this.nodes.Clear();
            return;
        }

        this._storageObject = data;
        this._insertStorageNode(this, data);

    }


    /**
     * Storage object
     * @type {Object}
     */
    get storage() {
        return this._storageObject;
    }
    /**
     * Storage object
     * @type {Object}
     */
    set storage(value) {
        this._storageObject = value;
        if(value) {
            this.binding = 'app.manage.storages.' + this._storageObject.name; 
            this.nodes.Clear();
            this._insertStorageNode(this, this._storageObject);
        } else {
            this.binding = null; 
            this.nodes.Clear();
        }

  
    }
    
}