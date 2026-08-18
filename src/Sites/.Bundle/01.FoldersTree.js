/**
 * FoldersTree component
 * @class
 * @extends Colibri.UI.Tree
 * @memberof App.Modules.Sites
 */
App.Modules.Sites.FoldersTree = class extends Colibri.UI.Tree {
    
    /**
     * Constructor
     * @param {string} name - The name of the component
     * @param {Colibri.UI.Component} container - The container of the component
     * @constructor
     */
    constructor(name, container) {
        super(name, container);
        this.AddClass('app-manager-folder-tree');
        this._foldersList = [];

        this.hasSearchBox = true;
        this.searchBoxUseEvent = true;

        this.AddHandler('Searched', this.__thisSearched);

        this.AddHandler('NodeExpanded', this.__thisNodeExpanded);
        this.AddHandler('NodeCollapsed', this.__thisNodeExpanded);
    }

    /**
     * @param {Colibri.UI.Event} event - The event object
     * @param {Object} args - The arguments of the event
     * @private
     * @ignore
     */
    __thisSearched(event, args) {
        this.nodes.Clear();
        this._renderDomains(args.term);
    }

    /**
     * @private
     * @ignore
     */
    _setIcon(node) {
        if(node.expanded && !node.isLeaf) {
            node.icon = App.Modules.Sites.Icons.FolderIconPublished; 
        } else {
            node.icon = App.Modules.Sites.Icons.FolderIconPublishedClosed; 
        }
    }

    /**
     * @param {Colibri.UI.Event} event - The event object
     * @param {Object} args - The arguments of the event
     * @private
     * @ignore
     */
    __thisNodeExpanded(event, args) {
        
        if(!args.node.isLeaf && args.node?.nodes?.Children('firstChild')?.name === 'fake') {
            args.node.nodes.Children('firstChild').Dispose();
            args.node.icon = Colibri.UI.LoadingIcon;
            Colibri.Common.Delay(100).then(() => {
                this._renderLevel(args.node, args.node.tag.data.id, args.node.tag.data.domain, this.searchBoxText);
                this._setIcon(args.node);
            })
        } else {
            this._setIcon(args.node);
        }
        
    }

    /**
     * Find the level of folders for the specified domain and parent
     * @param {string} domain - The domain id
     * @param {string} parent - The parent folder id
     * @returns {Array} - The list of folders at the specified level
     * @private
     * @ignore
     */
    _findLevel(domain, parent) {
        let ret = [];
        for(const folder of this._foldersList) {
            if((folder?.domain?.id ?? folder?.domain) == domain && (folder?.parent?.id ?? folder?.parent ?? 0) == parent) {
                ret.push(folder);
            }
        }
        ret.sort((a, b) => {
            if(a.order > b.order) {
                return 1;
            }
            else if(a.order < b.order) {
                return -1;
            }
            return 0;
        });
        return ret;
    }

    /**
     * Insert a folder node into the tree
     * @param {Colibri.UI.TreeNode} parenNode - The parent node to insert the folder into
     * @param {Object} folder - The folder object to insert
     * @param {string} term - The search term (optional)
     * @returns {Colibri.UI.TreeNode} - The newly inserted node
     * @private
     * @ignore
     */
    _insertFolderNode(parenNode, folder, term = '') {
        let newNode = this.FindNode('folder' + folder.id);
        if(!newNode) {
            newNode = parenNode.nodes.Add('folder' + folder.id);
            this._addFake(newNode, folder.id, folder?.domain);
        }
        newNode.text = folder.description[Lang.Current] ?? folder.description;
        newNode.tag = {type: 'page', data: folder};
        if((folder?.published ?? folder?.published?.value) == 1) {
            newNode.AddClass('published');
        } else {
            newNode.RemoveClass('published');
        }

        newNode.icon = App.Modules.Sites.Icons.FolderIconPublishedClosed;
        if(newNode.expanded && !newNode.isLeaf) {
            newNode.icon = App.Modules.Sites.Icons.FolderIconPublished;
        }
        if(term) {
            newNode.found = term;
        }
        return newNode;
    }

    /**
     * Add a fake node to the specified parent node to indicate loading
     * @param {Colibri.UI.TreeNode} node - The node to add the fake child to
     * @param {string} parent - The parent folder id
     * @param {string} domain - The domain id
     * @private
     * @ignore
     */
    _addFake(node, parent, domain) {

        const level = this._findLevel((domain?.id ?? domain), parent);
        if(level.length === 0) {
            return;
        }

        const fake = node.nodes.Add('fake');
        fake.text = 'Loading ...';

    }

    /**
     * Render the folders at the specified level
     * @param {Colibri.UI.TreeNode} node - The parent node to render into
     * @param {string} parent - The parent folder id
     * @param {string} domain - The domain id
     * @param {string} term - The search term (optional)
     * @private
     * @ignore
     */
    _renderLevel(node, parent, domain, term = '') {
        

        const level = this._findLevel((domain?.id ?? domain), parent);

        let found = term ? Array.unique(this._foldersList.filter(f => Lang.Translate(f.description).toLowerCase().indexOf(term.toLowerCase()) !== -1).map(f => f.path)) : [];
        found = found.concat.apply([], found)

        for(const folder of level) {
            if(term && folder.path.filter(x => found.includes(x)).length === 0) {
                continue;
            }

            let newNode = this._insertFolderNode(node, folder, term);
            if(!folder.parent) {
                newNode.parentNode = this.FindNode('domain' + (folder?.domain?.id ?? folder?.domain));
            }
            else {
                newNode.parentNode = this.FindNode('folder' + (folder?.parent?.id ?? folder?.parent));
            }

            const nested = this._findLevel((domain?.id ?? domain), folder.id);
            if(nested.length > 0 && newNode.nodes.Children('firstChild')?.name !== 'fake') {
                this._renderLevel(newNode, folder.id, folder?.domain, term);
            }

        }

        this._removeUnexistent();

    }

    /**
     * Render the pages for all domains
     * @returns {Promise} - A promise that resolves when rendering is complete
     * @private
     * @ignore
     */
    _renderPages() {
        return new Promise((resolve, reject) => {
            for(const domain of this._domainsList) {
                const newNode = this.FindNode('domain' + domain.id);
                this._renderLevel(newNode, 0, domain, this.searchBoxText);
            }
            resolve();
        });
    }

    /**
     * Render the domains and their folders
     * @private
     * @ignore
     */
    _renderDomains() {

        const term = this.searchBoxText;
        let found = term ? Array.unique(this._foldersList.filter(f => Lang.Translate(f.description).toLowerCase().indexOf(term.toLowerCase()) !== -1).map(f => f.domain)) : [];
        const domainsFound = this._domainsList.filter(d => Lang.Translate(d.description).toLowerCase().indexOf(term.toLowerCase()) !== -1).map(d => d.id);
        found = found.concat(domainsFound);

        for(const domain of this._domainsList) {
            if(term && found.indexOf(domain.id) === -1) {
                continue;
            }

            let newNode = this.FindNode('domain' + domain.id);
            if(!newNode) {
                newNode = this.nodes.Add('domain' + domain.id);
            }
            newNode.text = domain.description[Lang.Current] ?? domain.description;
            if(term) {
                newNode.found = term;
            }
            newNode.tag = {type: 'domain', data: domain};
            newNode.AddClass('published');
            newNode.icon = App.Modules.Sites.Icons.FolderIconPublishedClosed;
            if(newNode.expanded && !newNode.isLeaf) {
                newNode.icon = App.Modules.Sites.Icons.FolderIconPublished;
            }
            if((domain?.closed ?? domain?.closed?.value) == 1) {
                newNode.RemoveClass('published');
            } else {
                newNode.AddClass('published');
            }

            this._renderLevel(newNode, 0, domain, term);
    
        }

        this._removeUnexistent();

    }

    /**
     * Remove nodes that no longer exist in the current data
     * @private
     * @ignore
     */
    _removeUnexistent() {
        this.allNodes.forEach((node) => {
            if(node.tag === null) {
                return true;
            }

            if(node.tag.type === 'domain' && this._domainsList.indexOf(node.tag.data) === -1) {
                node.Dispose();
            }
            else if(node.tag.type === 'page' && this._foldersList.indexOf(node.tag.data) === -1) {
                node.Dispose();
            }
        });
    } 

    /**
     * Render bounded to component data
     * @protected
     * @param {*} data 
     * @param {String} path 
     * @ignore
     */
    __renderBoundedValues(data, path) {

        Promise.all([
            Sites.Store.AsyncQuery('sites.domains'),
            Sites.Store.AsyncQuery('sites.pages'),
        ]).then((responses) => {

            let domains = responses[0];
            let data = responses[1];

            if(Object.isObject(domains)) {
                domains = Object.values(domains);
            }

            if(Object.isObject(data)) {
                data = Object.values(data);
            }
    
            this._domainsList = domains;
            this._foldersList = data;
            for(const f of this._foldersList) {
                f.path = this._getPath(f, this._foldersList);
            }

            this._renderDomains();
            
            // Colibri.Common.Delay(100).then(() => {
            //     this._renderPages().then(() => {
            //         this._removeUnexistent();
            //     });
            // });

        }); 

        

    }

    /**
     * Get the path of a folder by traversing its parents
     * @param {Object} f - The folder object
     * @param {Array} list - The list of all folders
     * @returns {Array} - The path of folder ids from root to the specified folder
     * @private
     * @ignore
     */
    _getPath(f, list) {
        let ret = [];
        ret.push(f.id);
        while(f.parent) {
            ret.push(f.parent);
            f = list.find(item => item.id === f.parent);
        }
        return ret.reverse();
    }
    
}