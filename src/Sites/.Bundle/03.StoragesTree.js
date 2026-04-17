App.Modules.Sites.StoragesTree = class extends Colibri.UI.Tree {
    
    constructor(name, container) {
        super(name, container);
        this.AddClass('app-modules-sites-storagestree-component');

        this._foldersList = [];

        this.AddHandler('NodeClicked', this.__thisNodeClicked);

    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __thisNodeClicked(event, args) {
        args.item.Expand();
   }
 

    /**
     * Render bounded to component data
     * @protected
     * @param {*} data 
     * @param {String} path 
     */
    __renderBoundedValues(data, path) {
        if(!data) {
            return;
        }

        if(Object.isObject(data)) {
            data = Object.values(data);
        }

        const selection = this.selected?.tag ?? null;

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
                    moduleNode.AddClass('app-modules-sites-storagestree-module-node');
                    moduleNode.icon = App.Modules.Sites.Icons.ModuleIcon;
                }

                if(storage.group) {
                    const group = (storage.group ? ((storage.group[Lang.Current] ?? storage.group)) : '');
                    let groupNode = moduleNode.nodes.Children(group);
                    if(!groupNode) {
                        groupNode = moduleNode.nodes.Add(group);
                        groupNode.text = group;
                        groupNode.tag = 'group';
                        groupNode.AddClass('app-modules-sites-storagestree-group-node');
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

                let newNode = this.FindNode(storage.module + '-' + storage.name);
                if(!newNode) {
                    newNode = (groupNode ? groupNode : moduleNode).nodes.Add(storage.module + '-' + storage.name);
                }
                newNode.text = desc;
                newNode.isLeaf = true;
                newNode.icon = App.Modules.Sites.Icons.StorageIcon;
                newNode.AddClass('app-modules-sites-storagestree-storage-node');
                newNode.tag = storage;

                return true;

            });

            if(selection) {
                const moduleNode = this.FindNode(selection.module);
                moduleNode.Expand();
                this.selected = this.FindNode(selection.module + '-' + selection.name);
            }
           
        });
       

    }
    
}