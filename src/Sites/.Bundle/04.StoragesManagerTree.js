App.Modules.Sites.StoragesManagerTree = class extends Colibri.UI.Tree {
    
    

    constructor(name, container) {
        super(name, container);
        this.AddClass('app-manager-tree-component');
        this._foldersList = [];
        this._names = new Map();
    }

    _searchForFieldIcon(field) {
    
        let icon = '';
        Object.forEach(Colibri.UI.Forms.Field.Components, (name, value) => {
            if(value.className === field.component) {
                icon = field.icon;
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

    _insertStorageNode(moduleNode, storage) {
        if(!storage.params.visible) {
            return null;
        }
        this._names.set(storage.name, storage.name);
        let storageNode = this.FindNode(storage.name);
        if(!storageNode) {
            storageNode = moduleNode.nodes.Add(storage.name);
        }
        
        const group = (storage.group ? ((storage.group[Lang.Current] ?? storage.group) + ': ') : '');
        const desc = storage.desc[Lang.Current] ?? storage.desc;

        storageNode.text = group + desc + ' (' + storage.name + ')';
        storageNode.isLeaf = Object.countKeys(storage.fields) == 0;
        storageNode.icon = App.Modules.Sites.Icons.StorageIcon;
        storageNode.tag.entry = storage;
        storageNode.tag.type = 'storage';
        storageNode.isLeaf = false;

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


        moduleNode.isLeaf = false;

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

        fieldNode.text = (field.desc[Lang.Current] ?? field.desc) + 
            ' (' + name + (field?.params?.list ? ', <span class="inlist">inlist</span>' : '') + 
            (field?.params?.greed ? ', <span class="greed">' + field?.params?.greed + '</span>' : '') + 
            (field?.params?.viewer ? ', <span class="viewer">' + field?.params?.viewer + '</span>' : '') + 
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
        Object.forEach(storage.indices, (name, index) => {
            this._insertIndexNode(storageNode, name, index);
        });
    }


    __renderBoundedValues(data, path) {
        
        if(!data) {
            return;
        }

        if(!Array.isArray(data) && data instanceof Object) {
            data = Object.values(data);
        }

        if(path.indexOf('.modules') !== -1) {
            data.forEach((module) => {
                const moduleNode = this._insertModuleNode(module);
            });
        }
        else if(path.indexOf('.rawstorages') !== -1) {

            this._names.clear();
            
            data.forEach((storage) => {
                const moduleNode = this.FindNode(storage.module);
                const storageNode = this._insertStorageNode(moduleNode, storage);
            });

            for(const node of this._allNodes) {
                if(node.tag.type !== 'module' && !this._names.has(node.name)) {
                    node.Dispose();
                }
            }

        }

    }
    
}