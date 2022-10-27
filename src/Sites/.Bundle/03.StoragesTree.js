App.Modules.Sites.StoragesTree = class extends Colibri.UI.Tree {
    
    constructor(name, container) {
        super(name, container);
        this._foldersList = [];
    }


    __renderBoundedValues(data) {
        if(!data) {
            return;
        }

        if(!Array.isArray(data) && data instanceof Object) {
            data = Object.values(data);
        }

        Manage.Store.AsyncQuery('manage.modules').then((modules) => {
                
            this.nodes.Clear();
            data.forEach((storage) => {

                if(storage?.params?.visible === false) {
                    return true;
                }
                
                const module = Array.find(modules, 'name', storage.module);
                let moduleNode = this.FindNode(storage.module);
                if(!moduleNode) {
                    moduleNode = this.nodes.Add(storage.module);
                    moduleNode.text = module.desc;
                    moduleNode.tag = 'module';
                    moduleNode.icon = App.Modules.Sites.Icons.ModuleIcon;
                }

                let newNode = this.FindNode(storage.name);
                if(!newNode) {
                    newNode = moduleNode.nodes.Add(storage.name);
                }
                newNode.text = storage.desc;
                newNode.isLeaf = true;
                newNode.icon = App.Modules.Sites.Icons.StorageIcon;
                newNode.tag = storage;

                return true;

            });
        });
       

    }
    
}