App.Modules.Sites.FoldersTree = class extends Colibri.UI.Tree {
    
    constructor(name, container) {
        super(name, container);
        this._foldersList = [];
    }

    _findLevel(parent) {
        let ret = [];
        this._foldersList.forEach((folder) => {
            if(folder?.parent?.id == parent) {
                folder.isLeaf = this._findLevel(folder.id).length === 0;
                ret.push(folder);
            }
        });
        return ret;
    }

    _renderLevel(node, parent) {

        const folders = this._findLevel(parent);
        folders.forEach((folder) => {
            let newNode = this.FindNode(folder.id + folder.name);
            if(!newNode) {
                newNode = node.nodes.Add(folder.id + folder.name);
            }
            newNode.text = folder.description;
            newNode.isLeaf = folder.isLeaf;
            newNode.icon = folder.published.value == 1 ? App.Modules.Sites.Icons.FolderIconPublished : App.Modules.Sites.Icons.FolderIconUnpublished;
            newNode.tag = folder;
            

            if(!folder.parent) {
                newNode.parentNode = this.FindNode('root');
            }
            else if(folder.parent.id != newNode.parentNode?.tag?.id) {
                const parentNode = this.FindNode(folder.parent.id + folder.parent.name);
                newNode.parentNode = parentNode;
                parentNode.Expand();
            }

            this._renderLevel(newNode, folder.id);

        });

    }

    _removeUnexistent() {
        this.allNodes.forEach((node) => {
            if(node.tag === null) {
                return true;
            }
            if(this._foldersList.indexOf(node.tag) === -1) {
                node.Dispose();
            }
        });
    }

    __renderBoundedValues(data) {

        if(!Array.isArray(data) && data instanceof Object) {
            data = Object.values(data);
        }

        this._foldersList = data;

        let newNode = this.FindNode('root');
        if(!newNode) {
            newNode = this.nodes.Add('root');
        }
        newNode.text = 'Главная страница';
        newNode.isLeaf = false;
        newNode.icon = App.Modules.Sites.Icons.FolderIconPublished;
        newNode.tag = null;

        this._renderLevel(newNode, null);
        newNode.Expand();

        this._removeUnexistent();

    }
    
}