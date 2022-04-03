App.Modules.Sites.StructurePage = class extends Colibri.UI.Component 
{

    constructor(name, container) {
        super(name, container, Colibri.UI.Templates['App.Modules.Sites.StructurePage']);

        this.AddClass('app-sites-pages-page-component');

        this._folders = this.Children('split/folders-pane/folders');
        this._publications = this.Children('split/publications-pane/publications');

        this._folders.AddHandler('ContextMenuIconClicked', (event, args) => this.__renderFoldersContextMenu(event, args))
        this._folders.AddHandler('ContextMenuItemClicked', (event, args) => this.__clickOnFoldersContextMenu(event, args));        
        this._folders.AddHandler('DoubleClicked', (event, args) => this.__foldersDoubleClick(event, args));

    }

    __renderFoldersContextMenu(event, args) {

        let contextmenu = [];
        
        const itemData = args.item?.value;
        if(!itemData) {
            contextmenu.push({name: 'new-root-folder', title: 'Новый раздел', icon: Colibri.UI.ContextMenuAddIcon});

            this._folders.contextmenu = contextmenu;
            this._folders.ShowContextMenu(args.isContextMenuEvent ? 'right bottom' : 'left top', '', args.isContextMenuEvent ? {left: args.domEvent.clientX, top: args.domEvent.clientY} : null);

        }
        else {
            contextmenu.push({name: 'new-child-folder', title: 'Новый дочерний раздел', icon: Colibri.UI.ContextMenuAddIcon});
            contextmenu.push({name: 'edit-folder', title: 'Редактировать раздел', icon: Colibri.UI.ContextMenuEditIcon});
            contextmenu.push({name: 'remove-folder', title: 'Удалить раздел', icon: Colibri.UI.ContextMenuRemoveIcon});

            args.item.contextmenu = contextmenu;
            args.item.ShowContextMenu(args.isContextMenuEvent ? 'right bottom' : 'left bottom', '', args.isContextMenuEvent ? {left: args.domEvent.clientX, top: args.domEvent.clientY} : null);
        }
        

    }

    __clickOnFoldersContextMenu(event, args) {

        const item = args?.item;
        const menuData = args.menuData;
        if(!menuData) {
            return false;
        }

        if(menuData.name == 'new-root-folder') {
            if(Security.IsCommandAllowed('sites.structure.add')) {
                Manage.FormWindow.Show('Новый раздел', 800, 'app.manage.storages(pages)', {})
                    .then((data) => {
                        Sites.SaveFolder(data);
                    })
                    .catch(() => {});
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }
        }
        else if(menuData.name == 'edit-folder') {

            if(Security.IsCommandAllowed('sites.structure.edit')) {
                Manage.FormWindow.Show('Редактировать раздел', 800, 'app.manage.storages(pages)', item.tag)
                    .then((data) => {
                        data.parent = item.tag?.parent?.id ?? 0;
                        Sites.SaveFolder(data);
                    })
                    .catch(() => {});
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }

        }
        else if(menuData.name == 'new-child-folder') {

            if(Security.IsCommandAllowed('sites.structure.add')) {
                Manage.FormWindow.Show('Новый дочерний раздел', 800, 'app.manage.storages(pages)', {})
                    .then((data) => {
                        data.parent = item.tag.id;
                        item.Expand();
                        Sites.SaveFolder(data);
                    })
                    .catch(() => {});
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }

        }
        else if(menuData.name == 'remove-folder') {
            App.Confirm.Show('Удаление папки', 'Вы уверены, что хотите удалить папку?', 'Удалить!').then(() => {
                Sites.DeleteFolder(item.tag.id);
            });
        }
    }

    __foldersDoubleClick(event, args) {
        const item = this._folders.selected;
        if(!item) {
            if(Security.IsCommandAllowed('sites.structure.add')) {
                Manage.FormWindow.Show('Новый раздел', 800, 'app.manage.storages(pages)', {})
                    .then((data) => {
                        Sites.SaveFolder(data);
                    })
                    .catch(() => {});
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }
        }
        else {
            if(Security.IsCommandAllowed('sites.structure.edit')) {
                Manage.FormWindow.Show('Редактировать раздел', 800, 'app.manage.storages(pages)', item.tag)
                    .then((data) => {
                        data.parent = item.tag?.parent?.id ?? 0;
                        Sites.SaveFolder(data);
                    })
                    .catch(() => {});
            }
            else {
                App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
            }
        }
    }

}