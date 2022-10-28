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

                if(storage.group) {
                    let groupNode = moduleNode.nodes.Children(storage.group);
                    if(!groupNode) {
                        groupNode = moduleNode.nodes.Add(storage.group);
                        groupNode.text = storage.group;
                        groupNode.tag = 'group';
                        groupNode.icon = Colibri.UI.FolderIcon;
                    }
                }

            });

            data.forEach((storage) => {

                if(storage?.params?.visible === false) {
                    return true;
                }
                
                let moduleNode = this.FindNode(storage.module);
                let groupNode = storage.group ? moduleNode.nodes.Children(storage.group) : null;

                let newNode = this.FindNode(storage.name);
                if(!newNode) {
                    newNode = (groupNode ? groupNode : moduleNode).nodes.Add(storage.name);
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