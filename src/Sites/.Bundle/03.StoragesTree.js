App.Modules.Sites.StoragesTree = class extends Colibri.UI.Tree {
    
    constructor(name, container) {
        super(name, container);
        this._foldersList = [];

        this.AddHandler('NodeClicked', (event, args) => this.__thisNodeClicked(event, args));

    }

    __thisNodeClicked(event, args) {
        if(args.item.tag === 'module') {
            args.item.Expand();
        }
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
                    const group = (storage.group ? ((storage.group[Lang.Current] ?? storage.group)) : '');
                    let groupNode = moduleNode.nodes.Children(group);
                    if(!groupNode) {
                        groupNode = moduleNode.nodes.Add(group);
                        groupNode.text = group;
                        groupNode.tag = 'group';
                        groupNode.icon = Colibri.UI.FolderIcon;
                    }
                }

            });

            data.forEach((storage) => {

                if(storage?.params?.visible === false) {
                    return true;
                }
                
                const desc = storage.desc[Lang.Current] ?? storage.desc;
                const group = (storage.group ? ((storage.group[Lang.Current] ?? storage.group)) : '');

                let moduleNode = this.FindNode(storage.module);
                let groupNode = group ? moduleNode.nodes.Children(group) : null;

                let newNode = this.FindNode(storage.name);
                if(!newNode) {
                    newNode = (groupNode ? groupNode : moduleNode).nodes.Add(storage.name);
                }
                newNode.text = desc;
                newNode.isLeaf = true;
                newNode.icon = App.Modules.Sites.Icons.StorageIcon;
                newNode.tag = storage;

                return true;

            });
           
        });
       

    }
    
}