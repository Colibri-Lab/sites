

App.Modules.Sites = class extends Colibri.Modules.Module {

    /** @constructor */
    constructor() {
        super('Sites');
    }



    InitializeModule() {
        super.InitializeModule();

        this._store = App.Store.AddChild('app.sites', {}, this);
        this._store.AddPathLoader('sites.domains', () => this.Domains(true));
        this._store.AddPathLoader('sites.pages', () => this.Pages(true));
        this._store.AddPathLoader('sites.domainkeys', () => this.DomainKeys(true));
        this._store.AddPathLoader('sites.status', () => this.Status(true));

        App.Store.AddPathHandler('app.settings.current', (current) => {
            this.Check(current).then((domainSettings) => {
                if (!domainSettings || Object.countKeys(domainSettings) == 0) {
                    return;
                }
                const module = eval(domainSettings.additional.settings.module);
                module.Render(domainSettings);
                App.Router.HandleDomReady();
            });
        });

        console.log('Initializing module Sites');

        App.AddHandler('ApplicationReady', (event, args) => {
            this.Render(document.body);
            // this.Status();
        });
        this._store.AddHandler('StoreLoaderCrushed', (event, args) => {
            if (args.status === 403) {
                location.reload();
            }
        });
        this.AddHandler('CallError', (event, args) => {
            console.log('sites', args);
            if (args.status === 403) {
                location.reload();
            }
        });

    }

    Render(container) {
        console.log('Rendering Module Sites');


    }

    RegisterEvents() {
        console.log('Registering module events for Sites');


    }

    RegisterEventHandlers() {
        console.log('Registering event handlers for Sites');


    }

    get Store() {
        return this._store;
    }


    /** API */

    Status(returnPromise = false) {
        const promise = this.Call('Dashboard', 'Status');
        if (returnPromise) {
            return promise;
        }
        promise.then((response) => {
            this._store.Set('sites.status', response.result);
        })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    Check(current) {
        return new Promise((resolve, reject) => {
            this.Call('Checks', 'Domain', { current: current }).then(response => {
                resolve(response.result);
            }).catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
        })
    }

    DomainKeys(returnPromise = false) {
        const promise = this.Call('Pages', 'DomainKeys');
        if (returnPromise) {
            return promise;
        }
        promise.then((response) => {
            this._store.Set('sites.domainkeys', response.result);
        }).catch(error => {
            App.Notices.Add(new Colibri.UI.Notice(error.result));
            console.error(error);
        });
    }

    Properties(type, obj) {
        return new Promise((resolve, reject) => {
            this.Call('Pages', 'Properties', { type: type, object: obj.id })
                .then((response) => {
                    Object.forEach(response.result.fields, (name, field) => {
                        if (field.attrs) {
                            eval('field.attrs = ' + field.attrs + ';');
                        }
                    });
                    resolve(response.result);
                })
                .catch(error => {
                    reject(error.result);
                });
        });
    }

    SaveProperties(type, obj, data) {
        this.Call('Pages', 'SaveProperties', { type: type, object: obj?.id, data: data })
            .then((response) => {
                const saved = response.result;
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-properties-saved}', Colibri.UI.Notice.Success, 3000));
                let rows = Object.values(this._store.Query('sites.' + type));
                for (const row of rows) {
                    if (row.id == obj.id) {
                        row.parameters = saved;
                    }
                }
                this._store.Set('sites.' + type, rows);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }


    SaveFolder(data) {
        data = Object.assign(data);
        this.Call('Pages', 'Save', data)
            .then((response) => {
                const saved = response.result;
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-pages-saved}', Colibri.UI.Notice.Success, 3000));
                const pages = Object.values(this._store.Query('sites.pages'));
                let found = null;
                pages.forEach((page) => {
                    if (page.id == saved.id) {
                        found = page;
                        return false;
                    }
                    return true;
                });

                if (!found) {
                    pages.push(saved);
                }
                else {
                    found.description = saved.description;
                    found.published = saved.published;
                    found.additional = saved.additional;
                    found.order = saved.order;
                }
                this._store.Set('sites.pages', pages);

            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    SaveDomain(data) {
        data = Object.assign(data);
        this.Call('Pages', 'SaveDomain', data)
            .then((response) => {
                const saved = response.result;
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-domains-saved}', Colibri.UI.Notice.Success, 3000));
                let domains = Object.values(this._store.Query('sites.domains'));
                if (!data?.id) {
                    domains.push(saved);
                }
                else {
                    domains = domains.map(d => d.id == saved.id ? saved : d);
                }
                this._store.Set('sites.domains', domains);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    DeleteDomain(id) {
        this.Call('Pages', 'DeleteDomain', { id: id })
            .then((response) => {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-domains-deleted}', Colibri.UI.Notice.Success, 3000));
                this._store.Set('sites.domains', response.result);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    DeleteFolder(id) {
        this.Call('Pages', 'Delete', { id: id })
            .then((response) => {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-pages-deleted}', Colibri.UI.Notice.Success, 3000));
                this._store.Set('sites.pages', response.result);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    MoveFolder(move, domain, to, siblingStatus) {
        this.Call('Pages', 'Move', { move: move.id, domain: domain.id, to: to?.id ?? null, sibling: siblingStatus })
            .then((response) => {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-pages-moved}', Colibri.UI.Notice.Success, 3000));
                this._store.Set('sites.pages', response.result);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    CopyPublication(pub, domain, to) {
        this.Call('Publications', 'Copy', { pub: pub.id, domain: domain.id, to: to?.id ?? null })
            .then((response) => {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-publications-copied}', Colibri.UI.Notice.Success, 3000));
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    MovePublication(pub, pubBefore) {
        this.Call('Publications', 'Move', { pub: pub.id, before: pubBefore.id })
            .then((response) => {
                const movedPub = response.result;
                let pubs = this._store.Query('sites.pubs');
                if (!pubs || !Array.isArray(pubs)) {
                    pubs = [];
                }
                pubs = pubs.map((p) => p.id == movedPub.id ? movedPub : p);
                this._store.Set('sites.pubs', pubs);
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-publications-moved}', Colibri.UI.Notice.Success, 3000));
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    DeletePublication(pubIds) {
        this.Call('Publications', 'Delete', { pubs: pubIds.join(',') })
            .then((response) => {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-publications-deleted}', Colibri.UI.Notice.Success, 3000));

                let pubs = this._store.Query('sites.pubs');
                if (!pubs || !Array.isArray(pubs)) {
                    pubs = [];
                }

                let newPubs = [];
                pubs.map((p) => {
                    if (pubIds.indexOf(p.id) === -1) {
                        newPubs.push(p);
                    }
                });
                this._store.Set('sites.pubs', newPubs);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    DeleteData(storage, dataIds) {
        this.Call('Data', 'Delete', { storage: storage.name, ids: dataIds.join(',') })
            .then((response) => {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-data-deleted}', Colibri.UI.Notice.Success, 3000));

                let data = this._store.Query('sites.data');
                if (!data || !Array.isArray(data)) {
                    data = [];
                }

                let newData = [];
                data.map((p) => {
                    if (storage.params.softdeletes && storage.params.deletedautoshow) {
                        if (dataIds.indexOf(p.id) !== -1) {
                            p.datedeleted = Date.Now().toDbDate();
                        }
                        newData.push(p);
                    } else {
                        if (dataIds.indexOf(p.id) === -1) {
                            newData.push(p);
                        }
                    }
                });
                this._store.Set('sites.data', newData);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }
    ClearAllData(storage) {
        this.Call('Data', 'Clear', { storage: storage.name })
            .then((response) => {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-data-cleared}', Colibri.UI.Notice.Success, 3000));

                if (storage.params.softdeletes && storage.params.deletedautoshow) {
                    let data = this._store.Query('sites.data');
                    if (!data || !Array.isArray(data)) {
                        data = [];
                    }
                    let newData = [];
                    data.map((p) => {
                        p.datedeleted = Date.Now().toDbDate();
                        newData.push(p);
                    });
                    this._store.Set('sites.data', newData);
                } else {
                    this._store.Set('sites.data', []);
                }


            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }
    DeleteData(storage, dataIds) {
        this.Call('Data', 'Delete', { storage: storage.name, ids: dataIds.join(',') })
            .then((response) => {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-data-deleted}', Colibri.UI.Notice.Success, 3000));

                let data = this._store.Query('sites.data');
                if (!data || !Array.isArray(data)) {
                    data = [];
                }

                let newData = [];
                data.map((p) => {
                    if (storage.params.softdeletes && storage.params.deletedautoshow) {
                        if (dataIds.indexOf(p.id) !== -1) {
                            p.datedeleted = Date.Now().toDbDate();
                        }
                        newData.push(p);
                    } else {
                        if (dataIds.indexOf(p.id) === -1) {
                            newData.push(p);
                        }
                    }
                });
                this._store.Set('sites.data', newData);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    RestoreData(storage, dataIds) {
        this.Call('Data', 'Restore', { storage: storage.name, ids: dataIds.join(',') })
            .then((response) => {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-data-restored}', Colibri.UI.Notice.Success, 3000));

                let data = this._store.Query('sites.data');
                if (!data || !Array.isArray(data)) {
                    data = [];
                }

                let newData = [];
                data.map((p) => {
                    if (dataIds.indexOf(p.id) !== -1) {
                        p.datedeleted = '';
                    }
                    newData.push(p);
                });
                this._store.Set('sites.data', newData);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    CreatePublication(domain, folder, storage, data) {

        this.Call('Publications', 'Create', { domain: domain.id, folder: folder?.id ?? null, storage, data: data })
            .then((response) => {
                let pubs = this._store.Query('sites.pubs');
                if (!pubs || !Array.isArray(pubs)) {
                    pubs = [];
                }
                pubs.push(response.result);
                this._store.Set('sites.pubs', pubs);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });

    }

    Publish(domain, folder, storage, ids) {

        this.Call('Publications', 'Publish', { domain: domain.id, folder: folder?.id ?? null, storage, ids: ids.join(',') })
            .then((response) => {
                let pubs = this._store.Query('sites.pubs');
                if (!pubs || !Array.isArray(pubs)) {
                    pubs = [];
                }
                pubs = pubs.concat(response.result);
                this._store.Set('sites.pubs', pubs);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });

    }

    SaveData(storage, data, pub = null) {
        this.Call('Data', 'Save', { storage: storage, data: data, pub: pub?.id ?? null })
            .then((response) => {
                if (pub) {
                    let p = response.result.pub;
                    let pubs = this._store.Query('sites.pubs');
                    if (!pubs || !Array.isArray(pubs)) {
                        pubs = [];
                    }
                    pubs = pubs.map(pp => pp.id == p.id ? p : pp);
                    this._store.Set('sites.pubs', pubs);
                }

                let dtas = this._store.Query('sites.data');
                if (!dtas || !Array.isArray(dtas)) {
                    dtas = [];
                }
                if (data?.id) {
                    // редактирование
                    dtas = dtas.map(dd => dd.id == data.id ? data : dd);
                }
                else {
                    dtas.push(response.result.datarow);
                }
                this._store.Set('sites.data', dtas);

            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result, Colibri.UI.Notice.Error, 15000));
                console.error(error);
            });
    }

    SaveDataInList(storage, data) {
        return this.Call('Data', 'SaveDataList', { storage: storage, data: data })
            .then((response) => {
                this._store.IntersectList('sites.data', 'id', response.result);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result, Colibri.UI.Notice.Error, 15000));
                console.error(error);
            });
    }

    ExportData(storage, term = null, filters = null, sortField = null, sortOrder = null) {
        this.Call('Data', 'Export', { storage: storage.name, term: term, filters: filters, sortfield: sortField, sortorder: sortOrder })
            .then((response) => {
                DownloadFile(response.result.filecontent, response.result.filename);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    LoadRow(storage, rowId) {
        return new Promise((resolve, reject) => {
            this.Call('Data', 'Row', { storage: storage, row: rowId }).then((response) => {
                resolve(response.result);
            }).catch((response) => {
                reject(response.result);
            });
        });
    }

    LoadPublications(domain, folder, term = null, page = 1, pagesize = 20, returnPromise = false) {
        this.Requests('Publications.List')?.Abort();
        const promise = this.Call('Publications', 'List', { domain: domain.id, folder: folder?.id ?? null, term: term, page: page, pagesize: pagesize }, {}, true, 'Publications.List');
        if (returnPromise) {
            return promise;
        }

        App.Loading.Show();
        promise.then((response) => {
            if (page == 1) {
                this._store.Set('sites.pubs', response.result);
            }
            else if (Array.isArray(response.result)) {
                let pubs = this._store.Query('sites.pubs');
                if (!pubs || !Array.isArray(pubs)) {
                    pubs = [];
                }
                pubs = pubs.concat(response.result);
                this._store.Set('sites.pubs', pubs);
            }
        }).catch(error => {
            if(error.status > 0) {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            }
        }).finally(() => {
            App.Loading.Hide();
        });
    }

    LoadData(storage, term = null, filters = null, sortField = null, sortOrder = null, page = 1, pagesize = 20, returnPromise = false) {
        this.Requests('Data.List')?.Abort();
        const promise = this.Call('Data', 'List', { storage: storage.name, term: term, filters: filters, sortfield: sortField, sortorder: sortOrder, page: page, pagesize: pagesize }, {}, true, 'Data.List');
        if (returnPromise) {
            return promise;
        }

        App.Loading.Show();
        promise.then((response) => {
            this._store.Set('sites.data', response.result);
        }).catch(error => {
            if(error.status > 0) {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            }
        }).finally(() => {
            App.Loading.Hide();
        });
    }


    SaveStorage(module, data) {
        this.Call('Storages', 'Save', { module: module?.name ?? module, data: data })
            .then((response) => {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-storage-saved}', Colibri.UI.Notice.Success, 3000));
                Manage.Store.Reload('manage.storages', false);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    DeleteStorage(module, storage) {
        this.Call('Storages', 'Delete', { module: module?.name ?? module, storage: storage?.name ?? storage })
            .then((response) => {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-storage-deleted}', Colibri.UI.Notice.Success, 3000));
                Manage.Store.Reload('manage.storages', false);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    _checkFieldExists(storage, pathTo) {
        let fieldExistance = null;
        const pathConverted = 'fieldExistance = storage.fields[\'' + pathTo.replaceAll('/', '\'].fields[\'') + '\'];';
        try {
            eval(pathConverted);
        } catch (e) {
            fieldExistance = null;
        }

        return !!fieldExistance;
    }

    SaveField(module, storage, pathTo, data, checkExistance = true) {
        return new Promise((resolve, reject) => {
            if (checkExistance && this._checkFieldExists(storage, pathTo)) {
                App.Prompt.Show('#{sites-storages-messages-field-exists}', {
                    name: {
                        component: 'Text',
                        default: data.name
                    }
                }, '#{sites-storages-messages-field-save}').then((newData) => {
                    data.name = newData.name;
                    pathTo = pathTo.replaceLastPart('/', newData.name);
                    return this.SaveField(module, storage, pathTo, data);
                }).catch(() => {
                    App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-field-exist}'));
                    console.error({ message: '#{sites-storages-messages-field-exist}' });
                    reject({ message: '#{sites-storages-messages-field-exist}' });
                });
            } else {
                this.Call('Storages', 'SaveField', { module: module?.name ?? module, storage: storage?.name ?? storage, path: pathTo, data: data })
                    .then((response) => {
                        App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-field-saved}', Colibri.UI.Notice.Success, 3000));
                        Manage.Store.Reload('manage.storages', false);
                        resolve(response);
                    })
                    .catch(error => {
                        App.Notices.Add(new Colibri.UI.Notice(error.result));
                        console.error(error);
                        reject(error);
                    });
            }
        });
    }

    DeleteField(module, storage, path) {
        this.Call('Storages', 'DeleteField', { module: module?.name ?? module, storage: storage?.name ?? storage, path: path })
            .then((response) => {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-field-deleted}', Colibri.UI.Notice.Success, 3000));
                Manage.Store.Reload('manage.storages', false);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    MoveField(module, storage, pathToMove, pathRelative, sibling) {
        this.Call('Storages', 'MoveField', { module: module?.name ?? module, storage: storage?.name ?? storage, move: pathToMove, relative: pathRelative, sibling: sibling })
            .then((response) => {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-field-moved}', Colibri.UI.Notice.Success, 3000));
                Manage.Store.Reload('manage.storages', false);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }


    SaveIndex(module, storage, data) {
        this.Call('Storages', 'SaveIndex', { module: module?.name ?? module, storage: storage?.name ?? storage, data: data })
            .then((response) => {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-index-saved}', Colibri.UI.Notice.Success, 3000));
                Manage.Store.Reload('manage.storages', false);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    DeleteIndex(module, storage, index) {
        this.Call('Storages', 'DeleteIndex', { module: module?.name ?? module, storage: storage?.name ?? storage, index: index?.name ?? index })
            .then((response) => {
                App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-index-deleted}', Colibri.UI.Notice.Success, 3000));
                Manage.Store.Reload('manage.storages', false);
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    Pages(returnPromise = false) {
        const promise = this.Call('Pages', 'List')
        if (returnPromise) {
            return promise;
        }

        promise.then((response) => {
            this._store.Set('sites.pages', response.result);
        }).catch((response) => {
            App.Notices && App.Notices.Add({
                severity: 'error',
                title: response.result,
                timeout: 5000
            });
        });
    }

    Domains(returnPromise = false) {
        const promise = this.Call('Pages', 'Domains')
        if (returnPromise) {
            return promise;
        }

        promise.then((response) => {
            this._store.Set('sites.domains', response.result);
        }).catch((response) => {
            App.Notices && App.Notices.Add(new Colibri.UI.Notice(response.result));
        });
    }

    Call(controller, method, params = null, headers = {}, withCredentials = true, requestKeyword = Date.Mc()) {
        if (!params) {
            params = {};
        }
        params['__raw'] = 1;
        return super.Call(controller, method, params, headers, withCredentials, requestKeyword);
    }


}

App.Modules.Sites.Icons = {};
App.Modules.Sites.Icons.FoldersIcon = '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M4 9V6H23V9H4ZM12 17H20V14H12V17Z" fill="#2E3A59"/><path d="M8 13V10H20V13H8Z" fill="#2E3A59"/><path d="M8 21H22V18H8V21Z" fill="#2E3A59"/></svg>';
App.Modules.Sites.Icons.StoragesIcon = '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 19.5556V8.44444C22 6.03556 18.337 4 14 4C9.663 4 6 6.03556 6 8.44444V19.5556C6 21.9644 9.663 24 14 24C18.337 24 22 21.9644 22 19.5556ZM14 6.22222C17.691 6.22222 19.931 7.89667 20 8.43778C19.931 8.99222 17.691 10.6667 14 10.6667C10.309 10.6667 8.069 8.99222 8 8.45111C8.069 7.89667 10.309 6.22222 14 6.22222ZM8 11.3411C9.479 12.2822 11.637 12.8889 14 12.8889C16.363 12.8889 18.521 12.2822 20 11.3411V13.9933C19.931 14.5478 17.691 16.2222 14 16.2222C10.309 16.2222 8.069 14.5478 8 14V11.3411ZM8 19.5556V16.8967C9.479 17.8378 11.637 18.4444 14 18.4444C16.363 18.4444 18.521 17.8378 20 16.8967V19.5489C19.931 20.1033 17.691 21.7778 14 21.7778C10.309 21.7778 8.069 20.1033 8 19.5556Z" fill="#2E3A59"/></svg>';
App.Modules.Sites.Icons.StoragesManageIcon = '<svg width="29" height="27" viewBox="0 0 29 27" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3C16.337 3 20 4.93954 20 7.2348C20 8.5 19.5 9 18 9.99483C16.521 10.8916 14.363 11.4696 12 11.4696C9.637 11.4696 7.479 10.8916 6 9.99483V12.5283C6.069 13.0502 8.309 14.6457 12 14.6457V16.7631C9.637 16.7631 7.479 16.1851 6 15.2883V17.8218C6.069 18.3437 8.309 19.9392 12 19.9392V22.0566C7.663 22.0566 4 20.1171 4 17.8218V7.2348C4 4.93954 7.663 3 12 3Z" fill="#2E3A59"/><path fill-rule="evenodd" clip-rule="evenodd" d="M21.4731 17C21.4731 18.3255 20.3659 19.4 19 19.4C17.6341 19.4 16.5269 18.3255 16.5269 17C16.5269 15.6745 17.6341 14.6 19 14.6C20.3659 14.6 21.4731 15.6745 21.4731 17ZM20.2366 17C20.2366 17.6627 19.683 18.2 19 18.2C18.3171 18.2 17.7635 17.6627 17.7635 17C17.7635 16.3373 18.3171 15.8 19 15.8C19.683 15.8 20.2366 16.3373 20.2366 17Z" fill="#2E3A59"/><path fill-rule="evenodd" clip-rule="evenodd" d="M13.0829 14.9458L14.2082 13.0543C14.3535 12.8101 14.6544 12.697 14.9312 12.7825L16.067 13.1335C16.2185 13.0253 16.3758 12.9261 16.5378 12.8361C16.6922 12.7499 16.8518 12.6716 17.016 12.6018L17.2707 11.4718C17.3328 11.1963 17.5842 11 17.8747 11H20.1254C20.416 11 20.6673 11.1963 20.7294 11.4718L20.9841 12.6018C21.1584 12.6759 21.3274 12.7595 21.4905 12.8519C21.6426 12.9377 21.7903 13.0316 21.933 13.1335L23.0688 12.7825C23.3456 12.697 23.6465 12.8101 23.7918 13.0543L24.9171 14.9458C25.0624 15.1899 25.0129 15.4994 24.7981 15.6893L23.9171 16.4683C23.9373 16.6453 23.9472 16.8226 23.9471 16.9993C23.9473 17.1765 23.9373 17.3543 23.9171 17.5317L24.7981 18.3107C25.0129 18.5007 25.0624 18.8101 24.9171 19.0543L23.7918 20.9458C23.6465 21.1899 23.3456 21.303 23.0688 21.2175L21.933 20.8666C21.7886 20.9696 21.639 21.0646 21.485 21.1512C21.3236 21.2424 21.1564 21.3249 20.9841 21.3982L20.7294 22.5282C20.6673 22.8037 20.416 23 20.1254 23H17.8747C17.5842 23 17.3328 22.8037 17.2707 22.5282L17.016 21.3982C16.8537 21.3292 16.6959 21.2519 16.5432 21.1669C16.3793 21.0761 16.2202 20.9759 16.067 20.8666L14.9312 21.2175C14.6544 21.303 14.3535 21.1899 14.2082 20.9458L13.0829 19.0543C12.9376 18.8101 12.9871 18.5007 13.2019 18.3107L14.0829 17.5317C14.0627 17.3545 14.0528 17.177 14.0529 17C14.0528 16.823 14.0627 16.6455 14.0829 16.4683L13.2019 15.6893C12.9871 15.4994 12.9376 15.1899 13.0829 14.9458ZM19.6277 12.2L19.9107 13.4554L20.4876 13.7008C20.6181 13.7563 20.7447 13.8189 20.867 13.8882L20.869 13.8893C20.983 13.9537 21.0937 14.024 21.2005 14.1002L21.708 14.4623L22.9697 14.0725L23.5974 15.1275L22.6186 15.993L22.688 16.6006C22.7032 16.7331 22.7106 16.8659 22.7105 16.9984L22.7105 17.0006C22.7107 17.1335 22.7032 17.2666 22.688 17.3994L22.6186 18.007L23.5974 18.8725L22.9697 19.9275L21.7079 19.5377L21.2005 19.8998C21.0923 19.9769 20.9803 20.0481 20.8648 20.113L20.8628 20.1141C20.7418 20.1825 20.6166 20.2443 20.4876 20.2992L19.9107 20.5446L19.6277 21.8H18.3724L18.0894 20.5446L17.5125 20.2992C17.391 20.2475 17.2728 20.1896 17.1583 20.1259L17.1563 20.1248C17.0334 20.0567 16.9142 19.9816 16.7995 19.8998L16.292 19.5377L15.0303 19.9275L14.4026 18.8725L15.3814 18.007L15.312 17.3994C15.2968 17.2668 15.2894 17.1338 15.2895 17.0011L15.2895 16.9989C15.2894 16.8662 15.2968 16.7332 15.312 16.6006L15.3814 15.993L14.4026 15.1275L15.0303 14.0725L16.292 14.4623L16.7995 14.1002C16.913 14.0193 17.0308 13.9449 17.1523 13.8774L17.1543 13.8763C17.27 13.8117 17.3895 13.7531 17.5125 13.7008L18.0894 13.4554L18.3724 12.2H19.6277Z" fill="#2E3A59"/></svg>';
App.Modules.Sites.Icons.FolderIconPublishedClosed = '<svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M46 64H144.629C144.85 64 146.285 53 152 53H200C205.5 53 205.5 64.5 205.5 64.5V78C205.5 78 205 177.5 205 198H46C46.0001 184 45.5 131 45.5 93H200C200 116 198 170 198 170C198 170 198.863 93 198.385 93H46V64Z" fill="#FF9C00"/></svg>';
App.Modules.Sites.Icons.FolderIconPublished = '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><path id="folders" fill="#ff9c00" d="M61,64H168.629c0.221,0,1.656-11,7.371-11h48c8.046,0,9,11,9,11l-2,14s-19.785,99.622-24,120H48c-3.62-15.63-16.985-67.57-26-105H181c4.976,21.1,19,77,19,77s9.863-92,9.385-92H61V64Z"/></svg>';
App.Modules.Sites.Icons.FolderIconUnpublished = '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><path id="folders" fill="#a5a5a5" d="M61,64H168.629c0.221,0,1.656-11,7.371-11h48c8.046,0,9,11,9,11l-2,14s-19.785,99.622-24,120H48c-3.62-15.63-16.985-67.57-26-105H181c4.976,21.1,19,77,19,77s9.863-92,9.385-92H61V64Z"/></svg>';
App.Modules.Sites.Icons.StorageIcon = '<svg id="storages" xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><g><path fill="#fff" d="M168.7,67.839c29.436,0,53.3,6.146,53.3,13.727a60.332,60.332,0,0,0-1.316,9.8c0,3.343,1.318,4.543,1.316,4.576-0.428,7.486-24.13,9.8-53.3,9.8s-52.873-1.011-53.3-8.5a12.747,12.747,0,0,0,1.316-5.883,53.929,53.929,0,0,0-1.316-9.8C115.4,73.985,139.266,67.839,168.7,67.839Z"/><path fill="#fff" d="M168.7,103.79c29.436,0,53.3,6.146,53.3,13.727a30.5,30.5,0,0,0-1.974,9.151A10.045,10.045,0,0,0,222,131.9c-0.428,7.486-24.13,9.805-53.3,9.805s-52.873-1.011-53.3-8.5a13.117,13.117,0,0,0,1.974-6.537,30.319,30.319,0,0,0-1.974-9.151C115.4,109.936,139.266,103.79,168.7,103.79Z"/><path fill="#2e5468" d="M167.054,43c16.141-.074,31.136,1.7,42.6,6.5,4.517,1.889,9.923,4.486,11.792,8.987,0.872,2.1.464,6.463,0.464,9.357v8.145a21.812,21.812,0,0,1-.066,4.073,8.463,8.463,0,0,1-1.358,3.1c-3.3,4.73-10.257,7.258-16.363,9.189-18.916,5.983-50.47,6.2-69.623.236-6.489-2.019-14.385-4.779-17.555-10.03a8.135,8.135,0,0,1-.961-2.491,18.083,18.083,0,0,1-.066-3.366V63.366a14.576,14.576,0,0,1,.4-4.712c1.424-3.683,5.018-5.835,8.38-7.573a68.024,68.024,0,0,1,14.242-4.948l6.028-1.212c2.509-.553,5.15-0.627,7.751-1.077l7.386-.606,2.849-.135Zm-0.563,9.021-2.55.067-6.956.438-5.035.572c-4.6.863-9.035,1.521-12.851,3.1-1.946.8-7.036,3.006-5.1,6.16,1.844,3.005,7.7,4.344,11.692,5.352,2.534,0.64,5.3.9,8.049,1.38l3.577,0.337,3.677,0.269a59.332,59.332,0,0,0,8.479.236,98.433,98.433,0,0,0,20.867-1.851c3.988-.884,7.824-1.676,10.864-3.5,1.2-.718,2.624-1.552,2.981-3.1a2.786,2.786,0,0,0-.96-2.592,14.983,14.983,0,0,0-5.863-3.2C188.785,52.636,177.991,52.039,166.491,52.023ZM117.768,92.38c0.783,0.611,1.332,1.558,2.12,2.188a27.551,27.551,0,0,0,5.8,3.635,79.076,79.076,0,0,0,8.678,3.231c16.994,5.375,45.927,6,64.225,1.279,6.742-1.741,12.988-3.57,17.919-7.1a14.428,14.428,0,0,0,3.511-3.231l0.132,0.1,0.663,1.01a8.949,8.949,0,0,1,1.06,2.659l0.033,14c0,3.28.224,6.216-.994,8.246-3.114,5.192-10.5,7.861-16.826,9.863-19.037,6.021-50.581,6.145-69.789.168-4.963-1.545-9.543-3.208-13.315-5.924a12.607,12.607,0,0,1-2.551-2.121,11.01,11.01,0,0,1-2.252-3.6c-0.571-1.84-.265-4.823-0.265-7.1l0.033-13.531A10.3,10.3,0,0,1,117.768,92.38Zm-0.033,35.914a13,13,0,0,1,1.557,1.649A32.583,32.583,0,0,0,123,132.67c4.641,2.826,10.311,4.468,16.23,5.991,4.214,1.085,8.7,1.412,13.282,2.222l5.565,0.5,7.187,0.336h5.267l3.246-.067,3.246-.1c2.542-.409,5.217-0.218,7.651-0.64l3.147-.336c3.074-.579,6.2-0.857,9.075-1.582a82.213,82.213,0,0,0,10-2.727,44.42,44.42,0,0,0,9.672-4.746,18.83,18.83,0,0,0,2.451-2.086,4.928,4.928,0,0,1,1.06-1.145l0.662,0.943a8.2,8.2,0,0,1,1.127,2.726L221.905,146c0,3.4.222,6.33-1.06,8.415-3.156,5.132-10.772,7.853-17.124,9.862-19.458,6.153-51.327,5.852-70.518-.27-6.093-1.943-13.175-4.628-16.23-9.592-1.282-2.084-1.06-5.015-1.06-8.415l0.033-14.036a8.241,8.241,0,0,1,1.126-2.726Z"/><path fill="#fff" d="M169.035,51.5c19.813,0,35.874,4.1,35.874,9.161s-16.061,9.161-35.874,9.161-35.874-4.1-35.874-9.161S149.222,51.5,169.035,51.5Z"/></g><g><path fill="#fff" d="M100.222,90.151c36.112,0,65.386,7.572,65.386,16.913,0,0.045-1.615,7.417-1.614,12.081,0,4.119,1.617,5.6,1.614,5.638-0.525,9.224-29.6,12.081-65.386,12.081s-64.864-1.246-65.387-10.47a15.785,15.785,0,0,0,1.614-7.249,66.788,66.788,0,0,0-1.614-12.081C34.835,97.723,64.11,90.151,100.222,90.151Z"/><path fill="#fff" d="M100.222,134.448c36.112,0,65.386,7.572,65.386,16.913,0,0.051-2.422,6.171-2.421,11.276,0,3.321,2.423,6.409,2.421,6.443-0.525,9.224-29.6,12.081-65.386,12.081s-64.864-1.246-65.387-10.47a16.227,16.227,0,0,0,2.422-8.054c0-5.117-2.422-11.231-2.422-11.276C34.835,142.02,64.11,134.448,100.222,134.448Z"/><path fill="#2e5468" d="M98.032,59.548c20.176-.091,38.92,2.093,53.244,7.978,5.646,2.319,12.4,5.509,14.739,11.037,1.091,2.58.58,7.937,0.58,11.491v10a26.324,26.324,0,0,1-.083,5,10.3,10.3,0,0,1-1.7,3.8c-4.123,5.809-12.821,8.913-20.453,11.284-23.645,7.348-63.088,7.609-87.029.29-8.111-2.48-17.981-5.869-21.944-12.318a9.9,9.9,0,0,1-1.2-3.059,21.793,21.793,0,0,1-.083-4.134V84.556c0-2.118-.092-4.292.5-5.787,1.781-4.523,6.273-7.166,10.475-9.3,5.3-2.692,11.377-4.451,17.8-6.076L70.416,61.9c3.136-.679,6.438-0.769,9.688-1.323l9.233-.744,3.561-.165Zm-0.7,11.078-3.188.083-8.695.537-6.293.7c-5.757,1.06-11.294,1.867-16.064,3.8-2.432.987-8.8,3.691-6.376,7.564,2.305,3.691,9.628,5.335,14.615,6.572,3.167,0.786,6.63,1.1,10.061,1.695L85.859,92l4.6,0.331a75.48,75.48,0,0,0,10.6.289c9.337,0,18.27-.572,26.084-2.273,4.985-1.085,9.78-2.059,13.58-4.3,1.5-.882,3.28-1.906,3.726-3.8a3.389,3.389,0,0,0-1.2-3.183c-1.887-1.894-4.52-2.944-7.329-3.927C125.2,71.38,111.7,70.646,97.328,70.626Zm-60.9,49.562c0.978,0.75,1.664,1.913,2.65,2.687a34.568,34.568,0,0,0,7.246,4.464,100.108,100.108,0,0,0,10.848,3.968c21.243,6.6,57.409,7.373,80.28,1.571,8.429-2.138,16.236-4.385,22.4-8.722a17.916,17.916,0,0,0,4.389-3.968l0.166,0.124,0.828,1.24a10.853,10.853,0,0,1,1.325,3.265q0.02,8.6.041,17.2c0,4.028.281,7.634-1.242,10.127-3.893,6.376-13.123,9.654-21.033,12.112-23.8,7.394-63.226,7.547-87.236.206-6.2-1.9-11.929-3.939-16.644-7.275a15.652,15.652,0,0,1-3.188-2.6,13.455,13.455,0,0,1-2.815-4.423c-0.714-2.259-.331-5.922-0.331-8.722q0.021-8.307.041-16.617A12.553,12.553,0,0,1,36.424,120.188Zm-0.041,44.105c0.587,0.24,1.387,1.575,1.946,2.025a40.8,40.8,0,0,0,4.637,3.349c5.8,3.47,12.889,5.486,20.288,7.357,5.267,1.332,10.871,1.735,16.6,2.729l6.956,0.62,8.985,0.413h6.583l4.058-.083,4.057-.124c3.177-.5,6.521-0.268,9.564-0.785l3.933-.414c3.843-.711,7.749-1.052,11.345-1.942,4.36-1.08,8.589-1.833,12.5-3.348,4.356-1.687,8.553-3.344,12.089-5.829a23.51,23.51,0,0,0,3.064-2.563,6.11,6.11,0,0,1,1.325-1.405l0.828,1.157a10,10,0,0,1,1.408,3.349q0.02,8.618.041,17.237c0,4.176.278,7.773-1.325,10.333-3.945,6.3-13.464,9.645-21.4,12.112-24.322,7.556-64.158,7.187-88.147-.331-7.616-2.387-16.469-5.684-20.287-11.781-1.6-2.559-1.325-6.158-1.325-10.333L34.147,168.8a10.032,10.032,0,0,1,1.408-3.349Z"/><path fill="#fff" d="M100.615,70.022c24.293,0,43.986,5.047,43.986,11.273s-19.693,11.273-43.986,11.273S56.629,87.521,56.629,81.3,76.323,70.022,100.615,70.022Z"/></g></svg>';
App.Modules.Sites.Icons.ContextMenuStorageIcon = '<svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.24542 1.61621C11.3136 1.60689 13.2349 1.83076 14.7032 2.434C15.2819 2.67171 15.9743 2.9987 16.214 3.56535C16.3258 3.82981 16.2735 4.37893 16.2735 4.74323V5.76828C16.2869 5.939 16.2841 6.11062 16.265 6.2808C16.234 6.42115 16.1747 6.5537 16.0907 6.67032C15.6681 7.26577 14.7765 7.58395 13.9942 7.82699C11.5704 8.58019 7.52733 8.60695 5.07326 7.85671C4.24185 7.6025 3.23012 7.25511 2.8239 6.59406C2.76571 6.49712 2.72414 6.39114 2.70089 6.2805C2.68463 6.13983 2.68178 5.99794 2.69238 5.85674V4.17966C2.69238 3.96255 2.68295 3.73971 2.74363 3.58646C2.92619 3.12283 3.38665 2.85191 3.81737 2.63317C4.36065 2.35722 4.98357 2.17692 5.64196 2.01035L6.41464 1.85731C6.7361 1.78771 7.07457 1.77848 7.40771 1.72169L8.35414 1.64543L8.71916 1.62852L9.24542 1.61621ZM9.17367 2.75176L8.84688 2.76027L7.9556 2.81532L7.31054 2.88707C6.72041 2.99573 6.15285 3.07845 5.6639 3.27659C5.4146 3.37776 4.76185 3.65493 5.01033 4.05194C5.2466 4.43028 5.99724 4.5988 6.50843 4.7256C6.83307 4.80617 7.18804 4.83835 7.53974 4.89935L7.99763 4.9427L8.46915 4.97663C8.83019 5.01197 9.19327 5.02187 9.5557 5.00626C10.5128 5.00626 11.4285 4.94762 12.2294 4.77326C12.7404 4.66205 13.2319 4.56221 13.6215 4.33249C13.7752 4.24208 13.9577 4.13712 14.0034 3.94297C14.0135 3.88257 14.0074 3.82058 13.9858 3.76329C13.9642 3.70599 13.9278 3.65542 13.8804 3.6167C13.687 3.42256 13.4171 3.31493 13.1291 3.21416C12.0303 2.82905 10.6465 2.75381 9.17326 2.75176H9.17367ZM2.93112 7.83211C3.03136 7.90899 3.10168 8.0282 3.20275 8.10754C3.43054 8.29008 3.68002 8.44377 3.9455 8.56513C4.30802 8.72199 4.6793 8.8578 5.05748 8.97187C7.23499 9.6484 10.9422 9.72763 13.2866 9.1329C14.1506 8.91375 14.9508 8.68342 15.5827 8.23885C15.7542 8.12914 15.9062 7.99169 16.0326 7.83211L16.0496 7.84482L16.1345 7.97193C16.1977 8.07535 16.2435 8.18839 16.2703 8.30661C16.2717 8.8943 16.2731 9.482 16.2745 10.0697C16.2745 10.4826 16.3033 10.8522 16.1472 11.1078C15.7481 11.7613 14.802 12.0973 13.9912 12.3493C11.5516 13.1072 7.51022 13.1229 5.04907 12.3704C4.41354 12.1757 3.82629 11.9666 3.34298 11.6247C3.2228 11.5506 3.11292 11.461 3.01619 11.3582C2.89121 11.2274 2.79317 11.0734 2.72764 10.9048C2.65445 10.6732 2.69371 10.2978 2.69371 10.0108C2.69515 9.44308 2.69655 8.8753 2.69792 8.30743C2.74162 8.1346 2.82075 7.97274 2.9303 7.83211H2.93112ZM2.92691 12.3531C2.98708 12.3777 3.06909 12.5145 3.12639 12.5607C3.2766 12.6861 3.43543 12.8008 3.6017 12.904C4.19623 13.2596 4.92289 13.4663 5.68132 13.6581C6.22122 13.7946 6.79565 13.8359 7.3829 13.9378L8.09593 14.0014L9.01694 14.0437H9.69173L10.1077 14.0352L10.5236 14.0225C10.8492 13.9712 11.192 13.995 11.5039 13.942L11.9071 13.8996C12.301 13.8267 12.7014 13.7917 13.07 13.7005C13.5169 13.5898 13.9504 13.5126 14.3513 13.3573C14.7978 13.1844 15.228 13.0146 15.5905 12.7598C15.7024 12.6813 15.8075 12.5934 15.9046 12.4971C15.9419 12.4422 15.9877 12.3936 16.0404 12.3531L16.1252 12.4717C16.1939 12.5763 16.2428 12.6927 16.2696 12.815C16.2709 13.4039 16.2723 13.9929 16.2738 14.5819C16.2738 15.0099 16.3023 15.3786 16.138 15.641C15.7336 16.2868 14.7578 16.6297 13.9443 16.8826C11.4512 17.6571 7.36784 17.6193 4.90885 16.8486C4.12817 16.604 3.22069 16.266 2.82933 15.641C2.66532 15.3787 2.69351 15.0098 2.69351 14.5819L2.69689 12.8151C2.72371 12.6928 2.77262 12.5765 2.84122 12.4718L2.92691 12.3531Z" fill="white"/></svg>';
App.Modules.Sites.Icons.ModuleIcon = '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.5011 3L3 7.31453L8.5011 11.625L14 7.31453L8.5011 3ZM19.5 3L14 7.31453L19.5 11.625L25 7.31453L19.5 3ZM3 15.9368L8.5011 20.2486L14 15.9368L8.5011 11.625L3 15.9368ZM19.5 11.625L14 15.9368L19.5 20.2486L25 15.9368L19.5 11.625ZM8.5011 21.6855L14 26L19.5 21.6855L14 17.375L8.5011 21.6855Z" fill="#2E3A59"/></svg>';
App.Modules.Sites.Icons.IndexesIcon = '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.072 2C7.27195 2 5 4.10895 5 6.70815C5 8.1779 5.7266 9.49084 6.86366 10.3542C5.7266 11.2175 5 12.5304 5 14.0002C5 15.4698 5.72651 16.7827 6.86346 17.646C5.72651 18.5093 5 19.8222 5 21.2918C5 23.891 7.27195 26 10.072 26C12.8721 26 15.1441 23.891 15.1441 21.2918V17.9358C15.9434 18.4241 16.9003 18.7083 17.928 18.7083C20.7281 18.7083 23 16.5994 23 14.0002C23 12.5304 22.2734 11.2175 21.1363 10.3542C22.2734 9.49084 23 8.1779 23 6.70815C23 4.10895 20.7281 2 17.928 2H10.072ZM7.28859 6.70815C7.28859 5.28222 8.5359 4.1244 10.072 4.1244H12.8555V9.29191H10.072C8.5359 9.29191 7.28859 8.13408 7.28859 6.70815ZM20.7114 6.70815C20.7114 8.13408 19.4641 9.29191 17.928 9.29191H15.1445V4.1244H17.928C19.4641 4.1244 20.7114 5.28222 20.7114 6.70815ZM7.28859 14.0002C7.28859 12.5742 8.5359 11.4164 10.072 11.4164H12.8555V16.5837H10.0715L10.0428 16.5838C8.52014 16.5692 7.28859 15.417 7.28859 14.0002ZM15.1445 14.0002C15.1445 12.5742 16.3918 11.4164 17.928 11.4164C19.4641 11.4164 20.7114 12.5742 20.7114 14.0002C20.7114 15.4261 19.4641 16.5839 17.928 16.5839C16.3918 16.5839 15.1445 15.4261 15.1445 14.0002ZM7.28859 21.2918C7.28859 19.875 8.52014 18.7228 10.0428 18.7082L10.072 18.7083H12.8555V21.2918C12.8555 22.7178 11.6082 23.8756 10.072 23.8756C8.5359 23.8756 7.28859 22.7178 7.28859 21.2918Z" fill="#2E3A59"/></svg>';
App.Modules.Sites.Icons.IndexIcon = '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.71429 8C10.6466 8 11.5268 8.22328 12.3042 8.61928C11.6856 9.34485 11.1967 10.1844 10.8733 11.102C10.5191 10.9446 10.1269 10.8571 9.71429 10.8571C8.13633 10.8571 6.85714 12.1363 6.85714 13.7143C6.85714 15.2922 8.13633 16.5714 9.71429 16.5714C11.2922 16.5714 12.5714 15.2922 12.5714 13.7143C12.5714 12.2651 13.1109 10.9419 14 9.93454C15.0471 8.74822 16.579 8 18.2857 8C21.4416 8 24 10.5584 24 13.7143C24 16.8702 21.4416 19.4286 18.2857 19.4286C16.579 19.4286 15.0471 18.6803 14 17.494C12.9529 18.6803 11.421 19.4286 9.71429 19.4286C6.55837 19.4286 4 16.8702 4 13.7143C4 10.5584 6.55837 8 9.71429 8ZM15.4286 13.7143C15.4286 15.2922 16.7078 16.5714 18.2857 16.5714C19.8637 16.5714 21.1429 15.2922 21.1429 13.7143C21.1429 12.1363 19.8637 10.8571 18.2857 10.8571C16.7078 10.8571 15.4286 12.1363 15.4286 13.7143Z" fill="#2E3A59"/></svg>';
App.Modules.Sites.Icons.FieldsIcon = '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M11.5 11C13.0855 11 14.4248 9.94574 14.8551 8.5H24V6.5H14.8551C14.4248 5.05426 13.0855 4 11.5 4C9.567 4 8 5.567 8 7.5C8 9.433 9.567 11 11.5 11ZM13 7.5C13 8.32843 12.3284 9 11.5 9C10.6716 9 10 8.32843 10 7.5C10 6.67157 10.6716 6 11.5 6C12.3284 6 13 6.67157 13 7.5Z" fill="#2E3A59"/><path fill-rule="evenodd" clip-rule="evenodd" d="M18.5 17C20.0855 17 21.4248 15.9457 21.8551 14.5H24V12.5H21.8551C21.4248 11.0543 20.0855 10 18.5 10C16.567 10 15 11.567 15 13.5C15 15.433 16.567 17 18.5 17ZM18.5 15C19.3284 15 20 14.3284 20 13.5C20 12.6716 19.3284 12 18.5 12C17.6716 12 17 12.6716 17 13.5C17 14.3284 17.6716 15 18.5 15Z" fill="#2E3A59"/><path fill-rule="evenodd" clip-rule="evenodd" d="M9.5 23C11.433 23 13 21.433 13 19.5C13 17.567 11.433 16 9.5 16C7.91449 16 6.57521 17.0543 6.14494 18.5H4V20.5H6.14494C6.57521 21.9457 7.91449 23 9.5 23ZM9.5 21C10.3284 21 11 20.3284 11 19.5C11 18.6716 10.3284 18 9.5 18C8.67157 18 8 18.6716 8 19.5C8 20.3284 8.67157 21 9.5 21Z" fill="#2E3A59"/><path d="M14 18.5H24V20.5H14V18.5Z" fill="#2E3A59"/><path d="M14 12.5H4V14.5H14V12.5Z" fill="#2E3A59"/><path d="M7 6.5H4V8.5H7V6.5Z" fill="#2E3A59"/></svg>';
App.Modules.Sites.Icons.OnChangeIcon = '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.1935 20.6923C9.96442 20.4633 9.59401 20.4633 9.36494 20.6923C9.13587 20.9214 9.13587 21.2918 9.36494 21.5209L10.0278 22.1837H7.33744C5.58775 22.1837 4.16947 20.7606 4.16947 19.0157V17.0516C4.16947 16.7299 3.90628 16.4667 3.58461 16.4667C3.26294 16.4667 2.99976 16.7299 2.99976 17.0516V19.0157C2.99976 21.4088 4.9444 23.3534 7.33744 23.3534H10.0278L9.36494 24.0163C9.13587 24.2453 9.13587 24.6157 9.36494 24.8448C9.47704 24.9569 9.62813 25.0154 9.77922 25.0154C9.9303 25.0154 10.0765 24.9569 10.1935 24.8448L11.8555 23.1828C12.0845 22.9538 12.0845 22.5834 11.8555 22.3543L10.1935 20.6923Z" fill="black"/><path d="M13.2348 2.98578H3.62856C3.30689 2.98578 3.0437 3.24896 3.0437 3.57064V13.1769C3.0437 13.4986 3.30689 13.7618 3.62856 13.7618H13.2348C13.5565 13.7618 13.8197 13.4986 13.8197 13.1769V3.57064C13.8197 3.24896 13.5614 2.98578 13.2348 2.98578ZM12.65 12.592H4.21341V4.15549H12.65V12.592Z" fill="black"/><path d="M20.6576 4.6478H17.9673L18.6301 3.98497C18.8592 3.7559 18.8592 3.38549 18.6301 3.15642C18.401 2.92735 18.0306 2.92735 17.8016 3.15642L16.1445 4.81839C15.9154 5.04746 15.9154 5.41787 16.1445 5.64693L17.8064 7.3089C17.9185 7.421 18.0696 7.47948 18.2207 7.47948C18.3718 7.47948 18.518 7.421 18.635 7.3089C18.864 7.07983 18.864 6.70942 18.635 6.48035L17.9721 5.81752H20.6625C22.4122 5.81752 23.8304 7.24067 23.8304 8.98549V10.9496C23.8304 11.2713 24.0936 11.5345 24.4153 11.5345C24.737 11.5345 25.0002 11.2713 25.0002 10.9496V8.98549C25.0002 6.59245 23.0506 4.6478 20.6576 4.6478Z" fill="black"/><path d="M24.3715 23.8457C24.2155 23.8457 24.0644 23.9091 23.9572 24.0163C23.85 24.1235 23.7866 24.2746 23.7866 24.4306C23.7866 24.5816 23.85 24.7376 23.9572 24.8448C24.0644 24.9521 24.2155 25.0154 24.3715 25.0154C24.5274 25.0154 24.6785 24.9521 24.7858 24.8448C24.893 24.7376 24.9563 24.5865 24.9563 24.4306C24.9563 24.2746 24.893 24.1235 24.7858 24.0163C24.6737 23.9091 24.5226 23.8457 24.3715 23.8457Z" fill="black"/><path d="M21.9686 23.8457C21.647 23.8457 21.3838 24.1089 21.3838 24.4306C21.3838 24.7522 21.647 25.0154 21.9686 25.0154C22.2903 25.0154 22.5535 24.7522 22.5535 24.4306C22.5535 24.1089 22.2903 23.8457 21.9686 23.8457Z" fill="black"/><path d="M17.163 23.8457C16.8413 23.8457 16.5781 24.1089 16.5781 24.4306C16.5781 24.7522 16.8413 25.0154 17.163 25.0154C17.4847 25.0154 17.7478 24.7522 17.7478 24.4306C17.7478 24.1089 17.4895 23.8457 17.163 23.8457Z" fill="black"/><path d="M19.5658 23.8457C19.2441 23.8457 18.981 24.1089 18.981 24.4306C18.981 24.7522 19.2441 25.0154 19.5658 25.0154C19.8875 25.0154 20.1507 24.7522 20.1507 24.4306C20.1507 24.1089 19.8875 23.8457 19.5658 23.8457Z" fill="black"/><path d="M14.7653 23.8457C14.6093 23.8457 14.4582 23.9091 14.351 24.0163C14.2438 24.1235 14.1804 24.2746 14.1804 24.4306C14.1804 24.5816 14.2438 24.7376 14.351 24.8448C14.4582 24.9521 14.6093 25.0154 14.7653 25.0154C14.9164 25.0154 15.0723 24.9521 15.1795 24.8448C15.2868 24.7376 15.3501 24.5865 15.3501 24.4306C15.3501 24.2746 15.2868 24.1235 15.1795 24.0163C15.0723 23.9091 14.9163 23.8457 14.7653 23.8457Z" fill="black"/><path d="M14.7653 21.4429C14.4436 21.4429 14.1804 21.7061 14.1804 22.0278C14.1804 22.3495 14.4436 22.6126 14.7653 22.6126C15.0869 22.6126 15.3501 22.3495 15.3501 22.0278C15.3501 21.7061 15.0869 21.4429 14.7653 21.4429Z" fill="black"/><path d="M14.7653 19.0401C14.4436 19.0401 14.1804 19.3033 14.1804 19.625C14.1804 19.9466 14.4436 20.2098 14.7653 20.2098C15.0869 20.2098 15.3501 19.9466 15.3501 19.625C15.3501 19.3033 15.0869 19.0401 14.7653 19.0401Z" fill="black"/><path d="M14.7653 16.6374C14.4436 16.6374 14.1804 16.9006 14.1804 17.2222C14.1804 17.5439 14.4436 17.8071 14.7653 17.8071C15.0869 17.8071 15.3501 17.5439 15.3501 17.2222C15.3501 16.9006 15.0869 16.6374 14.7653 16.6374Z" fill="black"/><path d="M14.7653 14.2394C14.6093 14.2394 14.4582 14.3028 14.351 14.41C14.2438 14.5172 14.1804 14.6683 14.1804 14.8243C14.1804 14.9803 14.2438 15.1313 14.351 15.2386C14.4582 15.3458 14.6093 15.4092 14.7653 15.4092C14.9164 15.4092 15.0723 15.3458 15.1795 15.2386C15.2868 15.1313 15.3501 14.9803 15.3501 14.8243C15.3501 14.6732 15.2868 14.5172 15.1795 14.41C15.0674 14.2979 14.9163 14.2394 14.7653 14.2394Z" fill="black"/><path d="M21.9686 14.2394C21.647 14.2394 21.3838 14.5026 21.3838 14.8243C21.3838 15.146 21.647 15.4092 21.9686 15.4092C22.2903 15.4092 22.5535 15.146 22.5535 14.8243C22.5535 14.5026 22.2903 14.2394 21.9686 14.2394Z" fill="black"/><path d="M19.5658 14.2394C19.2441 14.2394 18.981 14.5026 18.981 14.8243C18.981 15.146 19.2441 15.4092 19.5658 15.4092C19.8875 15.4092 20.1507 15.146 20.1507 14.8243C20.1507 14.5026 19.8875 14.2394 19.5658 14.2394Z" fill="black"/><path d="M17.163 14.2394C16.8413 14.2394 16.5781 14.5026 16.5781 14.8243C16.5781 15.146 16.8413 15.4092 17.163 15.4092C17.4847 15.4092 17.7478 15.146 17.7478 14.8243C17.7478 14.5026 17.4895 14.2394 17.163 14.2394Z" fill="black"/><path d="M24.3715 14.2394C24.2155 14.2394 24.0644 14.3028 23.9572 14.41C23.85 14.5172 23.7866 14.6683 23.7866 14.8243C23.7866 14.9803 23.85 15.1313 23.9572 15.2386C24.0644 15.3458 24.2155 15.4092 24.3715 15.4092C24.5274 15.4092 24.6785 15.3458 24.7858 15.2386C24.893 15.1313 24.9563 14.9803 24.9563 14.8243C24.9563 14.6732 24.893 14.5172 24.7858 14.41C24.6737 14.3028 24.5226 14.2394 24.3715 14.2394Z" fill="black"/><path d="M24.3715 16.6374C24.0498 16.6374 23.7866 16.9006 23.7866 17.2222C23.7866 17.5439 24.0498 17.8071 24.3715 17.8071C24.6931 17.8071 24.9563 17.5439 24.9563 17.2222C24.9563 16.9006 24.6931 16.6374 24.3715 16.6374Z" fill="black"/><path d="M24.3715 21.4429C24.0498 21.4429 23.7866 21.7061 23.7866 22.0278C23.7866 22.3495 24.0498 22.6126 24.3715 22.6126C24.6931 22.6126 24.9563 22.3495 24.9563 22.0278C24.9563 21.7061 24.6931 21.4429 24.3715 21.4429Z" fill="black"/><path d="M24.3715 19.0401C24.0498 19.0401 23.7866 19.3033 23.7866 19.625C23.7866 19.9466 24.0498 20.2098 24.3715 20.2098C24.6931 20.2098 24.9563 19.9466 24.9563 19.625C24.9563 19.3033 24.6931 19.0401 24.3715 19.0401Z" fill="black"/></svg>';
App.Modules.Sites.Icons.ValueGenerator = '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_76_24)"><path d="M23.3492 3.00098H4.65084C4.43211 2.9933 4.21413 3.03072 4.01049 3.11092C3.80684 3.19111 3.62189 3.31236 3.46712 3.46712C3.31236 3.62189 3.19111 3.80684 3.11092 4.01049C3.03072 4.21413 2.9933 4.43211 3.00098 4.65084V23.3492C2.9933 23.5679 3.03072 23.7859 3.11092 23.9895C3.19111 24.1932 3.31236 24.3781 3.46712 24.5329C3.62189 24.6877 3.80684 24.8089 4.01049 24.8891C4.21413 24.9693 4.43211 25.0067 4.65084 24.999H23.3492C23.5679 25.0067 23.7859 24.9693 23.9895 24.8891C24.1932 24.8089 24.3781 24.6877 24.5329 24.5329C24.6877 24.3781 24.8089 24.1932 24.8891 23.9895C24.9693 23.7859 25.0067 23.5679 24.999 23.3492V4.65084C25.0067 4.43211 24.9693 4.21413 24.8891 4.01049C24.8089 3.80684 24.6877 3.62189 24.5329 3.46712C24.3781 3.31236 24.1932 3.19111 23.9895 3.11092C23.7859 3.03072 23.5679 2.9933 23.3492 3.00098ZM22.7992 22.7992H5.20079V5.20079H22.7992V22.7992Z" fill="black"/><path d="M8.50048 9.60039H19.4995C19.7912 9.60039 20.071 9.4845 20.2773 9.27823C20.4835 9.07196 20.5994 8.79219 20.5994 8.50048C20.5994 8.20877 20.4835 7.929 20.2773 7.72273C20.071 7.51646 19.7912 7.40058 19.4995 7.40058H8.50048C8.20877 7.40058 7.929 7.51646 7.72273 7.72273C7.51646 7.929 7.40058 8.20877 7.40058 8.50048C7.40058 8.79219 7.51646 9.07196 7.72273 9.27823C7.929 9.4845 8.20877 9.60039 8.50048 9.60039Z" fill="black"/><path d="M15.8148 11.6902V11.5802C15.6099 11.307 15.3442 11.0853 15.0387 10.9325C14.7333 10.7798 14.3965 10.7003 14.055 10.7003C13.7135 10.7003 13.3766 10.7798 13.0712 10.9325C12.7657 11.0853 12.5 11.307 12.2951 11.5802L8.11549 18.9496C8.02262 19.1925 8.01885 19.4605 8.10484 19.706C8.19084 19.9514 8.36103 20.1585 8.58521 20.2903C8.80939 20.4222 9.07305 20.4704 9.32937 20.4263C9.5857 20.3822 9.8181 20.2487 9.98532 20.0495L10.9202 18.3996H17.0797L18.0146 20.0495C18.0717 20.1988 18.1607 20.3339 18.2753 20.4453C18.3899 20.5568 18.5275 20.6419 18.6784 20.6948C18.8292 20.7476 18.9898 20.767 19.1489 20.7514C19.3081 20.7359 19.4619 20.6858 19.5997 20.6048C19.7375 20.5237 19.856 20.4136 19.9469 20.2821C20.0378 20.1505 20.0989 20.0008 20.126 19.8432C20.1531 19.6857 20.1455 19.5241 20.1038 19.3697C20.0621 19.2154 19.9872 19.072 19.8845 18.9496L15.8148 11.6902ZM12.1851 16.1998L14 12.9551L15.8148 16.1998H12.1851Z" fill="black"/></g><defs><clipPath id="clip0_76_24"><rect width="28" height="28" fill="white"/></clipPath></defs></svg>';
App.Modules.Sites.Icons.Attrs = '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.84106 17.8646C8.38169 17.8646 8.02075 18.2255 8.02075 18.6849C8.02075 19.1443 8.38169 19.5052 8.84106 19.5052C9.30044 19.5052 9.66138 19.1443 9.66138 18.6849C9.66138 18.2255 9.30044 17.8646 8.84106 17.8646ZM8.84106 8.02081C8.38169 8.02081 8.02075 8.38175 8.02075 8.84113C8.02075 9.3005 8.38169 9.66144 8.84106 9.66144C9.30044 9.66144 9.66138 9.3005 9.66138 8.84113C9.66138 8.38175 9.30044 8.02081 8.84106 8.02081ZM8.84106 12.9427C8.38169 12.9427 8.02075 13.3036 8.02075 13.763C8.02075 14.2224 8.38169 14.5833 8.84106 14.5833C9.30044 14.5833 9.66138 14.2224 9.66138 13.763C9.66138 13.3036 9.30044 12.9427 8.84106 12.9427ZM21.1458 3.09894H6.38013C4.57544 3.09894 3.09888 4.5755 3.09888 6.38019V21.1458C3.09888 22.9505 4.57544 24.4271 6.38013 24.4271H21.1458C22.9504 24.4271 24.427 22.9505 24.427 21.1458V6.38019C24.427 4.5755 22.9504 3.09894 21.1458 3.09894ZM22.7864 21.1458C22.7864 22.0482 22.0481 22.7864 21.1458 22.7864H6.38013C5.47778 22.7864 4.7395 22.0482 4.7395 21.1458V6.38019C4.7395 5.47784 5.47778 4.73956 6.38013 4.73956H21.1458C22.0481 4.73956 22.7864 5.47784 22.7864 6.38019V21.1458ZM18.6848 8.02081H12.1223C11.6629 8.02081 11.302 8.38175 11.302 8.84113C11.302 9.3005 11.6629 9.66144 12.1223 9.66144H18.6848C19.1442 9.66144 19.5051 9.3005 19.5051 8.84113C19.5051 8.38175 19.1442 8.02081 18.6848 8.02081ZM18.6848 12.9427H12.1223C11.6629 12.9427 11.302 13.3036 11.302 13.763C11.302 14.2224 11.6629 14.5833 12.1223 14.5833H18.6848C19.1442 14.5833 19.5051 14.2224 19.5051 13.763C19.5051 13.3036 19.1442 12.9427 18.6848 12.9427ZM18.6848 17.8646H12.1223C11.6629 17.8646 11.302 18.2255 11.302 18.6849C11.302 19.1443 11.6629 19.5052 12.1223 19.5052H18.6848C19.1442 19.5052 19.5051 19.1443 19.5051 18.6849C19.5051 18.2255 19.1442 17.8646 18.6848 17.8646Z" fill="black"/></svg>';

const Sites = new App.Modules.Sites();
