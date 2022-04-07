App.Modules.Sites.StoragesManagerTree = class extends Colibri.UI.Tree {
    
    constructor(name, container) {
        super(name, container);
        this._foldersList = [];
    }

    _searchForFieldIcon(field) {
        
        if(Colibri.UI.FieldIcons[field.component]) {
            return Colibri.UI.FieldIcons[field.component];
        }
        else {
            return Colibri.UI.FieldIcons['Text'];
        }
        
    }

    _insertModuleNode(module) {
        let moduleNode = this.FindNode(module.name);
        if(!moduleNode) {
            moduleNode = this.nodes.Add(module.name);
            moduleNode.text = module.desc + ' (' + module.name + ')';
            moduleNode.icon = App.Modules.Sites.Icons.ModuleIcon;
            moduleNode.tag.entry = module;
            moduleNode.tag.type = 'module';
        }
        return moduleNode;
    }

    _insertStorageNode(moduleNode, storage) {
        let storageNode = this.FindNode(storage.name);
        if(!storageNode) {
            storageNode = moduleNode.nodes.Add(storage.name);
        }
        storageNode.text = storage.desc + ' (' + storage.name + ')';
        storageNode.isLeaf = Object.countKeys(storage.fields) == 0;
        storageNode.icon = App.Modules.Sites.Icons.StorageIcon;
        storageNode.tag.entry = storage;
        storageNode.tag.type = 'storage';
        return storageNode;
    }

    _insertFieldNode(storageNode, name, field) {
        let fieldNode = this.FindNode(storageNode.name + '_' + name);
        if(!fieldNode) {
            fieldNode = storageNode.nodes.Add(storageNode.name + '_' + name);
        }
        fieldNode.text = field.desc + ' (' + name + ')';
        fieldNode.isLeaf = !field.fields || Object.countKeys(field.fields) == 0;
        fieldNode.icon = this._searchForFieldIcon(field);
        fieldNode.tag.entry = field;
        fieldNode.tag.type = 'field';
        return fieldNode;
    }

    _insertFieldFields(storageNode, storage) {
        if(!storage.fields) {
            return;
        }
        Object.forEach(storage.fields, (name, field) => {
            const fieldNode = this._insertFieldNode(storageNode, name, field);
            this._insertFieldFields(fieldNode, field);
        });
    }


    __renderBoundedValues(data) {
        if(!data) {
            return;
        }

        if(!Array.isArray(data) && data instanceof Object) {
            data = Object.values(data);
        }

        data.forEach((storage) => {

            if(storage?.params?.visible === false) {
                return true;
            }

            const moduleNode = this._insertModuleNode(storage.module);
            const storageNode = this._insertStorageNode(moduleNode, storage);

            this._insertFieldFields(storageNode, storage);

            return true;

        });

    }
    
}