

App.Modules.Sites = class extends Colibri.Modules.Module {

    /** @constructor */
    constructor() {
        super('Sites');
    }

    

    InitializeModule() {

        this._pages = {};
        this._pageMap = {
            profile: {
                route: '/sites/structure/',
                handle: () => {
                    Colibri.Common.Wait(() => this._store.Query('security.user').id).then(() => {
                        if(this.IsCommandAllowed('sites.structure')) {
                            this.FormWindow.Show('Личный кабинет', 800, 'app.manage.storages(users)', 'app.security.user')
                                .then((data) => {
                                    this.SaveUser(data);
                                })
                                .catch(() => {});
                        }
                        else {
                            App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
                        }
                    });
                    
                }
            },
            administrate: {
                className: 'App.Modules.Security.AdministratePage', 
                title: 'Администрирование',
                color: 'orange',
                route: '/security/administrate/'
            }
            
        }

        this._loginForm = null;

        this._store = App.Store.AddChild('app.security', {});
        this._store.AddPathLoader('security.roles', () => this.Roles(true));

        this._store.AddPathHandler('security.settings', (data) => {
            if(!data.logged) {
                this.LoginForm.Show();
            }
        });


        console.log('Initializing module Security');

        App.AddHandler('ApplicationReady', (event, args) => {
            this.Render(document.body);
            this.Settings();
        });

        App.Router.AddRoutePattern('/logout/', (url, options) => {
            this.Logout();
            App.Router.Navigate('', {});
        });

        Object.forEach(this._pageMap, (name, info) => {
            App.Router.AddRoutePattern(info.route, info.handle ?? ((url, options) => this.ShowPage(name)));
        });

    }

    Render(container) {
        console.log('Rendering Module Security');
        

    }

    RegisterEvents() {
        console.log('Registering module events for Security');
        

    }

    RegisterEventHandlers() {
        console.log('Registering event handlers for Security');

        this.AddHandler('RoutedToModule', (event, args) => {
            
        });

        this.AddHandler('RoutedToSelf', (event, args) => {
            Colibri.Common.Wait(() => this._store.Query('security.user').id).then(() => {
                if(this.IsCommandAllowed('security.profile')) {
                    this.FormWindow.Show('Личный кабинет', 800, 'app.manage.storages(users)', 'app.security.user')
                        .then((data) => {
                            this.SaveUser(data);
                        })
                        .catch(() => {});
                }
                else {
                    App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
                }
            });
        });

        this.AddHandler('RoutedToUsers', (event, args) => this.ShowPage('users'));
        this.AddHandler('RoutedToRoles', (event, args) => this.ShowPage('roles'));
        this.AddHandler('RoutedToPermissions', (event, args) => this.ShowPage('permission'));

    }

    ShowPage(name) {
        Colibri.Common.Wait(() => this._store.Query('security.user').id).then(() => {
            if(this.IsCommandAllowed('security.' + name)) {
        
                const pageInfo = this._pageMap[name];
                const componentClass = pageInfo.className;
                const title = pageInfo.title;
                const route = pageInfo.route;

                const componentObject = eval(componentClass);
                if(!componentObject) {
                    return;
                }

                let container = null;
                if(!this._pages[componentClass]) {

                    container = MainFrame.AddTab(componentClass, title, 'orange', true, name + '-container', () => {
                        this.RemovePage(name);
                    }, route);    

                    if(!this._pages[componentClass]) {
                        this._pages[componentClass] = new componentObject(name, container);
                    }
                    if(!this._pages[componentClass].isConnected) {
                        this._pages[componentClass].ConnectTo(container);
                    }
                    this._pages[componentClass].Show();

                }
                else if(MainFrame) {
                    MainFrame.SelectTab(this._pages[componentClass].parent);
                }

            }
            else {
                App.Notices && App.Notices.Add({
                    severity: 'error',
                    title: 'Действие запрещено',
                    timeout: 5000
                });
            }
        });


    }

    RemovePage(name) {
        const pageInfo = this._pageMap[name];
        const componentClass = pageInfo.className;

        if(this._pages[componentClass]) {
            this._pages[componentClass].Dispose();
            this._pages[componentClass].parent.Dispose();
            this._pages[componentClass] = null;
        }
    }


    get Store() {
        return this._store;
    }
    

}

const Sites = new App.Modules.Sites();
