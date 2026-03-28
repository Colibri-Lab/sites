

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
            if (App.Device.isElectron) {
                Colibri.IO.Request.Get('./domain.json', {}, {}, false).then((response) => {
                    resolve(JSON.parse(response.result));
                }).catch(e => {
                    App.Notices.Add(new Colibri.UI.Notice(error.result));
                    console.error(error);
                });
            } else {
                this.Call('Checks', 'Domain', { current: current }).then(response => {
                    resolve(response.result);
                }).catch(error => {
                    App.Notices.Add(new Colibri.UI.Notice(error.result));
                    console.error(error);
                });
            }
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
        return new Promise((resolve, reject) => {
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
                    resolve(saved);
                })
                .catch(error => {
                    App.Notices.Add(new Colibri.UI.Notice(error.result));
                    console.error(error);
                    reject(error.result);
                });
        });
    }


    SaveFolder(data) {
        return new Promise((resolve, reject) => {

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
                    resolve(found || saved);

                })
                .catch(error => {
                    App.Notices.Add(new Colibri.UI.Notice(error.result));
                    console.error(error);
                    reject(error.result);
                });
        });
    }

    SaveDomain(data) {
        return new Promise((resolve, reject) => {
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
                    resolve(saved);
                })
                .catch(error => {
                    App.Notices.Add(new Colibri.UI.Notice(error.result));
                    console.error(error);
                    reject(error.result);
                });
        });
    }

    DeleteDomain(id) {
        return new Promise((resolve, reject) => {
            this.Call('Pages', 'DeleteDomain', { id: id })
                .then((response) => {
                    App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-domains-deleted}', Colibri.UI.Notice.Success, 3000));
                    this._store.Set('sites.domains', response.result);
                    resolve(response.result);
                })
                .catch(error => {
                    App.Notices.Add(new Colibri.UI.Notice(error.result));
                    console.error(error);
                    reject(error.result);
                });
        });
    }

    DeleteFolder(id) {
        return new Promise((resolve, reject) => {
            this.Call('Pages', 'Delete', { id: id })
                .then((response) => {
                    App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-pages-deleted}', Colibri.UI.Notice.Success, 3000));
                    this._store.Set('sites.pages', response.result);
                    resolve(response.result);
                })
                .catch(error => {
                    App.Notices.Add(new Colibri.UI.Notice(error.result));
                    console.error(error);
                    reject(error.result);
                });
        });
    }

    MoveFolder(move, domain, to, siblingStatus) {
        return new Promise((resolve, reject) => {
            this.Call('Pages', 'Move', { move: move.id, domain: domain.id, to: to?.id ?? null, sibling: siblingStatus })
                .then((response) => {
                    App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-pages-moved}', Colibri.UI.Notice.Success, 3000));
                    this._store.Set('sites.pages', response.result);
                    resolve(response.result);
                })
                .catch(error => {
                    App.Notices.Add(new Colibri.UI.Notice(error.result));
                    console.error(error);
                    reject(error.result);
                });
        });
    }

    CopyPublication(pub, domain, to) {
        return new Promise((resolve, reject) => {
            this.Call('Publications', 'Copy', { pub: pub.id, domain: domain.id, to: to?.id ?? null })
                .then((response) => {
                    App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-publications-copied}', Colibri.UI.Notice.Success, 3000));
                    resolve(response.result);
                })
                .catch(error => {
                    App.Notices.Add(new Colibri.UI.Notice(error.result));
                    console.error(error);
                    reject(error.result);
                });
        });
    }

    MovePublication(pub, pubBefore) {
        return new Promise((resolve, reject) => {
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
                    resolve(response.result);
                })
                .catch(error => {
                    App.Notices.Add(new Colibri.UI.Notice(error.result));
                    console.error(error);
                    reject(error.result);
                });
        });
    }

    DeletePublication(pubIds) {
        return new Promise((resolve, reject) => {
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
                    resolve(response.result);
                })
                .catch(error => {
                    App.Notices.Add(new Colibri.UI.Notice(error.result));
                    console.error(error);
                    reject(error.result);
                });
        });
    }

    DeleteData(storage, dataIds) {
        return new Promise((resolve, reject) => {
            this.Call('Data', 'Delete', { storage: storage.name, module: storage.module, ids: dataIds.join(',') })
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
                    resolve(response.result);
                })
                .catch(error => {
                    App.Notices.Add(new Colibri.UI.Notice(error.result));
                    console.error(error);
                    reject(error.result);
                });
        });
    }
    ClearAllData(storage) {
        return new Promise((resolve, reject) => {
            this.Call('Data', 'Clear', { storage: storage.name, module: storage.module })
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
                    resolve(response.result);

                })
                .catch(error => {
                    App.Notices.Add(new Colibri.UI.Notice(error.result));
                    console.error(error);
                    reject(error.result);
                });
        });
    }
    DeleteData(storage, dataIds) {
        return new Promise((resolve, reject) => {
            this.Call('Data', 'Delete', { storage: storage.name, module: storage.module, ids: dataIds.join(',') })
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
                    resolve(response.result);
                })
                .catch(error => {
                    App.Notices.Add(new Colibri.UI.Notice(error.result));
                    console.error(error);
                    reject(error.result);
                });
        });
    }

    RestoreData(storage, dataIds) {
        return new Promise((resolve, reject) => {
            this.Call('Data', 'Restore', { storage: storage.name, module: storage.module, ids: dataIds.join(',') })
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
                    resolve(response.result);
                })
                .catch(error => {
                    App.Notices.Add(new Colibri.UI.Notice(error.result));
                    console.error(error);
                    reject(error.result);
                });
        });
    }

    CreatePublication(domain, folder, storage, module, data) {
        return new Promise((resolve, reject) => {

            this.Call('Publications', 'Create', { domain: domain.id, folder: folder?.id ?? null, storage, module, data: data })
                .then((response) => {
                    let pubs = this._store.Query('sites.pubs');
                    if (!pubs || !Array.isArray(pubs)) {
                        pubs = [];
                    }
                    pubs.push(response.result);
                    this._store.Set('sites.pubs', pubs);
                    resolve(response.result);
                })
                .catch(error => {
                    App.Notices.Add(new Colibri.UI.Notice(error.result));
                    console.error(error);
                    reject(error.result);
                });
        });

    }

    Publish(domain, folder, storage, module, ids) {
        return new Promise((resolve, reject) => {

            this.Call('Publications', 'Publish', { domain: domain.id, folder: folder?.id ?? null, storage, module, ids: ids.join(',') })
                .then((response) => {
                    let pubs = this._store.Query('sites.pubs');
                    if (!pubs || !Array.isArray(pubs)) {
                        pubs = [];
                    }
                    pubs = pubs.concat(response.result);
                    this._store.Set('sites.pubs', pubs);
                    resolve(response.result);
                })
                .catch(error => {
                    App.Notices.Add(new Colibri.UI.Notice(error.result));
                    console.error(error);
                    reject(error.result);
                });
        });

    }

    SaveData(storage, data, pub = null) {
        return new Promise((resolve, reject) => {
            this.Call('Data', 'Save', { storage: storage.name, module: storage.module, data: data, pub: pub?.id ?? null })
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
                    resolve(response.result);

                })
                .catch(error => {
                    App.Notices.Add(new Colibri.UI.Notice(error.result, Colibri.UI.Notice.Error, 15000));
                    console.error(error);
                    reject(error.result);
                });
        });
    }

    SaveDataInList(storage, module, data) {
        return new Promise((resolve, reject) => {
            return this.Call('Data', 'SaveDataList', { storage: storage, module: module, data: data })
                .then((response) => {
                    this._store.IntersectList('sites.data', 'id', response.result);
                    resolve(response.result);
                })
                .catch(error => {
                    App.Notices.Add(new Colibri.UI.Notice(error.result, Colibri.UI.Notice.Error, 15000));
                    console.error(error);
                    reject(error.result);
                });
        });
    }

    ExportData(storage, term = null, filters = null, sortField = null, sortOrder = null) {
        return new Promise((resolve, reject) => {
            this.Call('Data', 'Export', { storage: storage.name, module: storage.module, term: term, filters: filters, sortfield: sortField, sortorder: sortOrder })
                .then((response) => {
                    DownloadFile(response.result.filecontent, response.result.filename);
                    resolve(response.result);
                })
                .catch(error => {
                    App.Notices.Add(new Colibri.UI.Notice(error.result));
                    console.error(error);
                    reject(error.result);
                });
        });
    }

    ImportData(storage, file) {
        return new Promise((resolve, reject) => {
            App.Loading.Show();
            this.Call('Data', 'Import', { storage: storage.name, module: storage.module, file: file })
                .then((response) => {
                    resolve(response.result);
                })
                .catch(error => {
                    reject(error);
                })
                .finally(() => {
                    App.Loading.Hide();
                });
        })
    }

    LoadRow(storage, module, rowId) {
        return new Promise((resolve, reject) => {
            this.Call('Data', 'Row', { storage: storage, module: module, row: rowId }).then((response) => {
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
            if (error.status > 0) {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            }
        }).finally(() => {
            App.Loading.Hide();
        });
    }

    LoadData(storage, term = null, filters = null, sortField = null, sortOrder = null, page = 1, pagesize = 20, returnPromise = false) {
        this.Requests('Data.List')?.Abort();
        const promise = this.Call('Data', 'List', { storage: storage.name, module: storage.module, term: term, filters: filters, sortfield: sortField, sortorder: sortOrder, page: page, pagesize: pagesize }, {}, true, 'Data.List');
        if (returnPromise) {
            return promise;
        }

        App.Loading.Show();
        promise.then((response) => {
            this._store.Set('sites.data', response.result);
        }).catch(error => {
            if (error.status > 0) {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            }
        }).finally(() => {
            App.Loading.Hide();
        });
    }


    SaveStorage(module, data) {
        return new Promise((resolve, reject) => {
            this.Call('Storages', 'Save', { module: module?.name ?? module, data: data })
                .then((response) => {
                    App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-storage-saved}', Colibri.UI.Notice.Success, 3000));
                    Manage.Store.Reload('manage.storages', false);
                    resolve(response);
                })
                .catch(error => {
                    App.Notices.Add(new Colibri.UI.Notice(error.result));
                    console.error(error);
                    reject(error);
                });
        })
    }

    DeleteStorage(module, storage) {
        return new Promise((resolve, reject) => {
            this.Call('Storages', 'Delete', { module: module?.name ?? module, storage: storage?.name ?? storage })
                .then((response) => {
                    App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-storage-deleted}', Colibri.UI.Notice.Success, 3000));
                    Manage.Store.Reload('manage.storages', false);
                    resolve(response);
                })
                .catch(error => {
                    App.Notices.Add(new Colibri.UI.Notice(error.result));
                    console.error(error);
                    reject(error);
                });
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
        return new Promise((resolve, reject) => {
            this.Call('Storages', 'DeleteField', { module: module?.name ?? module, storage: storage?.name ?? storage, path: path })
                .then((response) => {
                    App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-field-deleted}', Colibri.UI.Notice.Success, 3000));
                    Manage.Store.Reload('manage.storages', false);
                    resolve(response);
                })
                .catch(error => {
                    App.Notices.Add(new Colibri.UI.Notice(error.result));
                    console.error(error);
                    reject(error);
                });
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
        return new Promise((resolve, reject) => {
            this.Call('Storages', 'SaveIndex', { module: module?.name ?? module, storage: storage?.name ?? storage, data: data })
                .then((response) => {
                    App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-index-saved}', Colibri.UI.Notice.Success, 3000));
                    Manage.Store.Reload('manage.storages', false);
                    resolve(response);
                })
                .catch(error => {
                    App.Notices.Add(new Colibri.UI.Notice(error.result));
                    console.error(error);
                    reject(error);
                });
        });
    }

    SaveTrigger(module, storage, data) {
        return new Promise((resolve, reject) => {
            this.Call('Storages', 'SaveTrigger', { module: module?.name ?? module, storage: storage?.name ?? storage, data: data })
                .then((response) => {
                    App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-trigger-saved}', Colibri.UI.Notice.Success, 3000));
                    Manage.Store.Reload('manage.storages', false);
                    resolve(response);
                })
                .catch(error => {
                    App.Notices.Add(new Colibri.UI.Notice(error.result));
                    console.error(error);
                    reject(error);
                });
        });
    }

    DeleteIndex(module, storage, index) {
        return new Promise((resolve, reject) => {
            this.Call('Storages', 'DeleteIndex', { module: module?.name ?? module, storage: storage?.name ?? storage, index: index?.name ?? index })
                .then((response) => {
                    App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-index-deleted}', Colibri.UI.Notice.Success, 3000));
                    Manage.Store.Reload('manage.storages', false);
                    resolve(response);
                })
                .catch(error => {
                    App.Notices.Add(new Colibri.UI.Notice(error.result));
                    console.error(error);
                    reject(error);
                });
        });
    }

    DeleteTrigger(module, storage, trigger) {
        return new Promise((resolve, reject) => {
            this.Call('Storages', 'DeleteTrigger', { module: module?.name ?? module, storage: storage?.name ?? storage, trigger: trigger?.name ?? trigger })
                .then((response) => {
                    App.Notices.Add(new Colibri.UI.Notice('#{sites-storages-messages-trigger-deleted}', Colibri.UI.Notice.Success, 3000));
                    Manage.Store.Reload('manage.storages', false);
                    resolve(response);
                })
                .catch(error => {
                    App.Notices.Add(new Colibri.UI.Notice(error.result));
                    console.error(error);
                    reject(error);
                });
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
App.Modules.Sites.Icons.FoldersIcon = '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M2 11.6V6H38V11.6H2ZM17.1579 26.5333H32.3158V20.9333H17.1579V26.5333Z" fill="black"/><path d="M9.57895 19.0666V13.4666H32.3158V19.0666H9.57895Z" fill="black"/><path d="M9.57895 34H36.1053V28.4H9.57895V34Z" fill="black"/></svg>';
App.Modules.Sites.Icons.StoragesIcon = '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M34 30.0001V9.99999C34 5.66401 27.5898 2 20 2C12.4103 2 6 5.66401 6 9.99999V30.0001C6 34.3359 12.4103 38 20 38C27.5898 38 34 34.3359 34 30.0001ZM20 6C26.4593 6 30.3792 9.01401 30.5 9.988C30.3792 10.986 26.4593 14.0001 20 14.0001C13.5408 14.0001 9.62075 10.986 9.5 10.012C9.62075 9.01401 13.5408 6 20 6ZM9.5 15.214C12.0883 16.908 15.8648 18 20 18C24.1353 18 27.9118 16.908 30.5 15.214V19.9879C30.3792 20.986 26.4593 24 20 24C13.5408 24 9.62075 20.986 9.5 20V15.214ZM9.5 30.0001V25.2141C12.0883 26.908 15.8648 27.9999 20 27.9999C24.1353 27.9999 27.9118 26.908 30.5 25.2141V29.988C30.3792 30.9859 26.4593 34 20 34C13.5408 34 9.62075 30.9859 9.5 30.0001Z" fill="black"/></svg>';
App.Modules.Sites.Icons.StoragesManageIcon = '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.7143 2C23.1492 2 29.4286 5.49117 29.4286 9.62264C29.4286 11.9 28.5714 12.8 26 14.5907C23.4646 16.2049 19.7652 17.2453 15.7143 17.2453C11.6634 17.2453 7.96399 16.2049 5.42856 14.5907V19.1509C5.54685 20.0904 9.38685 22.9623 15.7143 22.9623V26.7736C11.6634 26.7736 7.96399 25.7332 5.42856 24.1189V28.6792C5.54685 29.6187 9.38685 32.4906 15.7143 32.4906V36.3019C8.27942 36.3019 1.99998 32.8108 1.99998 28.6792V9.62264C1.99998 5.49117 8.27942 2 15.7143 2Z" fill="black"/><path fill-rule="evenodd" clip-rule="evenodd" d="M31.9539 27.2C31.9539 29.5859 30.0558 31.52 27.7143 31.52C25.3728 31.52 23.4747 29.5859 23.4747 27.2C23.4747 24.8141 25.3728 22.88 27.7143 22.88C30.0558 22.88 31.9539 24.8141 31.9539 27.2ZM29.8342 27.2C29.8342 28.3928 28.8852 29.36 27.7143 29.36C26.5436 29.36 25.5946 28.3928 25.5946 27.2C25.5946 26.0071 26.5436 25.04 27.7143 25.04C28.8852 25.04 29.8342 26.0071 29.8342 27.2Z" fill="black"/><path fill-rule="evenodd" clip-rule="evenodd" d="M17.5707 23.5024L19.4998 20.0977C19.7489 19.6582 20.2647 19.4546 20.7392 19.6085L22.6863 20.2403C22.946 20.0455 23.2157 19.867 23.4934 19.705C23.7581 19.5498 24.0317 19.4089 24.3132 19.2832L24.7498 17.2492C24.8562 16.7533 25.2872 16.4 25.7852 16.4H29.6436C30.1417 16.4 30.5725 16.7533 30.679 17.2492L31.1156 19.2832C31.4144 19.4166 31.7041 19.5671 31.9837 19.7334C32.2445 19.8879 32.4977 20.0569 32.7423 20.2403L34.6894 19.6085C35.1639 19.4546 35.6797 19.6582 35.9288 20.0977L37.8579 23.5024C38.107 23.9418 38.0221 24.4989 37.6539 24.8407L36.1436 26.2429C36.1783 26.5615 36.1952 26.8807 36.1951 27.1987C36.1954 27.5177 36.1783 27.8377 36.1436 28.1571L37.6539 29.5593C38.0221 29.9013 38.107 30.4582 37.8579 30.8977L35.9288 34.3024C35.6797 34.7418 35.1639 34.9454 34.6894 34.7915L32.7423 34.1599C32.4948 34.3453 32.2383 34.5163 31.9743 34.6722C31.6976 34.8363 31.411 34.9848 31.1156 35.1168L30.679 37.1508C30.5725 37.6467 30.1417 38 29.6436 38H25.7852C25.2872 38 24.8562 37.6467 24.7498 37.1508L24.3132 35.1168C24.0349 34.9926 23.7644 34.8534 23.5026 34.7004C23.2217 34.537 22.9489 34.3566 22.6863 34.1599L20.7392 34.7915C20.2647 34.9454 19.7489 34.7418 19.4998 34.3024L17.5707 30.8977C17.3216 30.4582 17.4065 29.9013 17.7747 29.5593L19.285 28.1571C19.2504 27.8381 19.2334 27.5186 19.2336 27.2C19.2334 26.8814 19.2504 26.5619 19.285 26.2429L17.7747 24.8407C17.4065 24.4989 17.3216 23.9418 17.5707 23.5024ZM28.7904 18.56L29.2755 20.8197L30.2645 21.2614C30.4882 21.3613 30.7052 21.474 30.9149 21.5988L30.9183 21.6007C31.1137 21.7167 31.3035 21.8432 31.4866 21.9804L32.3566 22.6321L34.5195 21.9305L35.5956 23.8295L33.9176 25.3874L34.0366 26.4811C34.0627 26.7196 34.0753 26.9586 34.0752 27.1971V27.2011C34.0755 27.4403 34.0627 27.6799 34.0366 27.9189L33.9176 29.0126L35.5956 30.5705L34.5195 32.4695L32.3564 31.7679L31.4866 32.4196C31.3011 32.5584 31.1091 32.6866 30.9111 32.8034L30.9077 32.8054C30.7003 32.9285 30.4856 33.0397 30.2645 33.1386L29.2755 33.5803L28.7904 35.84H26.6384L26.1533 33.5803L25.1643 33.1386C24.956 33.0455 24.7534 32.9413 24.5571 32.8266L24.5537 32.8246C24.343 32.7021 24.1386 32.5669 23.942 32.4196L23.072 31.7679L20.9091 32.4695L19.833 30.5705L21.511 29.0126L21.392 27.9189C21.366 27.6802 21.3533 27.4408 21.3534 27.202V27.198C21.3533 26.9592 21.366 26.7198 21.392 26.4811L21.511 25.3874L19.833 23.8295L20.9091 21.9305L23.072 22.6321L23.942 21.9804C24.1366 21.8347 24.3385 21.7008 24.5468 21.5793L24.5502 21.5773C24.7486 21.4611 24.9534 21.3556 25.1643 21.2614L26.1533 20.8197L26.6384 18.56H28.7904Z" fill="black"/></svg>';
App.Modules.Sites.Icons.FolderIconPublishedClosed = '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.1125 6.42759H24.304C24.3537 6.42759 24.6766 4 25.9625 4H36.7625C38 4 38 6.53793 38 6.53793V9.51724C38 9.51724 37.8875 31.4759 37.8875 36H2.1125C2.11252 32.9103 2 21.2138 2 12.8276H36.7625C36.7625 17.9034 36.3125 29.8207 36.3125 29.8207C36.3125 29.8207 36.5067 12.8276 36.3991 12.8276H2.1125V6.42759Z" fill="black"/></svg>';
App.Modules.Sites.Icons.FolderIconPublished = '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.65403 8.97241H27.0173C27.055 8.97241 27.2998 7 28.2749 7H36.4645C37.8372 7 38 8.97241 38 8.97241L37.6588 11.4828C37.6588 11.4828 34.2831 29.346 33.564 33H6.43602C5.81839 30.1974 3.5381 20.884 2 14.1724H29.128C29.9769 17.9559 32.3697 27.9793 32.3697 27.9793C32.3697 27.9793 34.0525 11.4828 33.9709 11.4828H8.65403V8.97241Z" fill="black"/></svg>';
App.Modules.Sites.Icons.FolderIconUnpublished = '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.65403 8.97241H27.0173C27.055 8.97241 27.2998 7 28.2749 7H36.4645C37.8372 7 38 8.97241 38 8.97241L37.6588 11.4828C37.6588 11.4828 34.2831 29.346 33.564 33H6.43602C5.81839 30.1974 3.5381 20.884 2 14.1724H29.128C29.9769 17.9559 32.3697 27.9793 32.3697 27.9793C32.3697 27.9793 34.0525 11.4828 33.9709 11.4828H8.65403V8.97241Z" fill="#A5A5A5"/></svg>';
App.Modules.Sites.Icons.StorageIcon = '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M27.793 8.64937C33.4295 8.64937 37.999 9.79968 37.999 11.2186C37.8638 11.8222 37.7795 12.4357 37.747 13.0528C37.747 13.6785 37.9994 13.9031 37.999 13.9092C37.917 15.3103 33.3785 15.7434 27.793 15.7434C22.2075 15.7434 17.6688 15.5542 17.587 14.1525C17.7599 13.8105 17.8463 13.4329 17.839 13.0515C17.8126 12.4338 17.7283 11.8198 17.587 11.2173C17.587 9.79968 22.1569 8.64937 27.793 8.64937Z" fill="white"/><path d="M27.793 15.3781C33.4295 15.3781 37.999 16.5284 37.999 17.9473C37.7836 18.4958 37.6561 19.0735 37.621 19.66C37.6496 20.0148 37.7807 20.3544 37.999 20.6393C37.917 22.0404 33.3785 22.4744 27.793 22.4744C22.2075 22.4744 17.6688 22.2852 17.587 20.8835C17.8213 20.5154 17.9517 20.0933 17.965 19.66C17.9305 19.0734 17.803 18.4956 17.587 17.9473C17.587 16.5284 22.1569 15.3781 27.793 15.3781Z" fill="white"/><path d="M27.4778 4.00041C30.5685 3.98656 33.4398 4.31859 35.6349 5.21698C36.4999 5.57053 37.535 6.05659 37.8929 6.89902C38.0599 7.29206 37.9818 8.10865 37.9818 8.6503V10.1748C38.0019 10.4287 37.9976 10.6839 37.9691 10.9371C37.9233 11.1456 37.8348 11.343 37.7091 11.5173C37.0772 12.4026 35.7451 12.8757 34.5759 13.2371C30.9538 14.3569 24.9118 14.3975 21.2443 13.2813C20.0018 12.9034 18.4898 12.3868 17.8828 11.404C17.7957 11.2596 17.7335 11.1021 17.6988 10.9378C17.6746 10.7287 17.6704 10.5177 17.6862 10.3078V7.81219C17.6624 7.5161 17.6883 7.21821 17.7628 6.93027C18.0355 6.24095 18.7236 5.83817 19.3674 5.51288C20.2385 5.10637 21.1532 4.79577 22.0945 4.5868L23.2487 4.35996C23.7292 4.25645 24.2349 4.2426 24.7329 4.15838L26.1472 4.04496L26.6927 4.01969L27.4778 4.00041ZM27.37 5.68882L26.8817 5.70136L25.5498 5.78333L24.5857 5.89039C23.7049 6.05191 22.8556 6.17507 22.1249 6.4706C21.7523 6.62033 20.7777 7.03321 21.1484 7.62353C21.5015 8.18595 22.6228 8.43656 23.3872 8.62522C23.8724 8.74501 24.402 8.79367 24.9284 8.88351L25.6134 8.94658L26.3174 8.99693C26.8569 9.0495 27.3994 9.06426 27.941 9.0411C29.2817 9.06488 30.6212 8.94874 31.9367 8.69466C32.7003 8.52921 33.4348 8.38098 34.0169 8.03959C34.2467 7.90521 34.5194 7.74911 34.5877 7.45938C34.6029 7.36988 34.594 7.27805 34.5617 7.19297C34.5295 7.10788 34.4751 7.0325 34.4039 6.97426C34.0806 6.69459 33.6968 6.48986 33.2813 6.37533C31.6389 5.80392 29.5721 5.69181 27.37 5.68882ZM18.0404 13.2425C18.1904 13.3569 18.2955 13.5341 18.4464 13.6521C18.7862 13.9231 19.1593 14.1516 19.557 14.3324C20.0983 14.5655 20.6531 14.7675 21.2187 14.9371C24.4727 15.9431 30.0128 16.0601 33.5166 15.1765C34.8076 14.8507 36.0035 14.5083 36.9477 13.8476C37.2046 13.6839 37.4318 13.4796 37.62 13.2429L37.6453 13.2616L37.7723 13.4507C37.8668 13.6048 37.9353 13.7729 37.9752 13.9483L37.9816 16.5686C37.9816 17.1825 38.0245 17.732 37.7912 18.112C37.195 19.0837 35.7807 19.5833 34.5694 19.958C30.9241 21.0849 24.884 21.1081 21.206 19.9894C20.2557 19.7002 19.3787 19.389 18.6564 18.8807C18.4764 18.7699 18.3122 18.6365 18.168 18.4837C17.9809 18.2886 17.8344 18.0597 17.7367 17.8099C17.6274 17.4655 17.686 16.9072 17.686 16.481L17.6923 13.9485C17.7577 13.6924 17.8762 13.4521 18.0404 13.2425ZM18.0341 19.9643C18.1425 20.0585 18.2423 20.1618 18.3323 20.273C18.5563 20.4592 18.7936 20.6298 19.0423 20.7834C19.9309 21.3123 21.0166 21.6196 22.15 21.9047C22.9569 22.1077 23.8159 22.1689 24.6933 22.3205L25.7589 22.4141L27.1351 22.477H28.1436L28.7651 22.4645L29.3867 22.4458C29.8734 22.3692 30.3857 22.405 30.8517 22.326L31.4543 22.2631C32.0429 22.1547 32.6415 22.1027 33.192 21.967C33.8406 21.8364 34.4802 21.6659 35.1068 21.4566C35.7588 21.235 36.3807 20.9368 36.9589 20.5683C37.1264 20.4515 37.2834 20.3209 37.4282 20.1779C37.4838 20.0964 37.5523 20.024 37.6311 19.9636L37.7579 20.1401C37.8608 20.296 37.9339 20.4689 37.9737 20.6503L37.9808 23.2783C37.9808 23.9146 38.0233 24.463 37.7778 24.8532C37.1735 25.8138 35.7152 26.323 34.4989 26.699C30.773 27.8507 24.6707 27.7943 20.996 26.6485C19.8293 26.2848 18.4732 25.7823 17.8882 24.8532C17.6427 24.4632 17.6852 23.9146 17.6852 23.2783L17.6916 20.6512C17.7315 20.4699 17.8045 20.297 17.9072 20.141L18.0341 19.9643Z" fill="black"/><path d="M27.8571 5.5913C31.6509 5.5913 34.7263 6.35867 34.7263 7.30591C34.7263 8.25314 31.6509 9.02051 27.8571 9.02051C24.0633 9.02051 20.9879 8.25314 20.9879 7.30591C20.9879 6.35867 24.0633 5.5913 27.8571 5.5913Z" fill="white"/><path d="M14.6807 12.8254C21.5955 12.8254 27.201 14.2426 27.201 15.9909C27.201 15.9993 26.8917 17.3791 26.8919 18.252C26.8919 19.0229 27.2015 19.3001 27.201 19.3072C27.1004 21.0336 21.5331 21.5683 14.6807 21.5683C7.82834 21.5683 2.26042 21.3351 2.16028 19.6087C2.37222 19.1869 2.47817 18.7218 2.46933 18.252C2.43704 17.4906 2.33359 16.7338 2.16028 15.9909C2.16028 14.2426 7.76591 12.8254 14.6807 12.8254Z" fill="white"/><path d="M14.6807 21.1162C21.5955 21.1162 27.201 22.5334 27.201 24.2817C27.201 24.2912 26.7372 25.4366 26.7374 26.3921C26.7374 27.0137 27.2013 27.5916 27.201 27.598C27.1004 29.3244 21.5331 29.8591 14.6807 29.8591C7.82834 29.8591 2.26042 29.6259 2.16028 27.8995C2.44771 27.4456 2.60768 26.9257 2.62405 26.3921C2.62405 25.4344 2.16028 24.2901 2.16028 24.2817C2.16028 22.5334 7.76591 21.1162 14.6807 21.1162Z" fill="white"/><path d="M14.2613 7.09759C18.1247 7.08056 21.7138 7.48933 24.4566 8.59078C25.5377 9.02482 26.831 9.62187 27.2789 10.6565C27.4878 11.1394 27.3899 12.142 27.3899 12.8072V14.6788C27.415 14.9906 27.4097 15.3039 27.374 15.6147C27.3162 15.8709 27.2054 16.1129 27.0485 16.3259C26.259 17.4131 24.5935 17.9941 23.1321 18.4378C18.6045 19.8131 11.0519 19.862 6.46764 18.4921C4.91453 18.0279 3.0246 17.3936 2.26576 16.1866C2.15707 16.0096 2.07941 15.8161 2.03598 15.6141C2.00561 15.3573 2.00028 15.0982 2.02009 14.8404V11.7782C2.02009 11.3818 2.00247 10.9749 2.11583 10.6951C2.45686 9.84852 3.31699 9.35385 4.1216 8.95444C5.13646 8.4506 6.30009 8.12138 7.52998 7.81724L8.97337 7.5378C9.57386 7.41072 10.2061 7.39387 10.8284 7.29019L12.5964 7.15094L13.2783 7.12005L14.2613 7.09759ZM14.1273 9.17099L13.5169 9.18653L11.8519 9.28703L10.6469 9.41805C9.54456 9.61644 8.48433 9.76748 7.57096 10.1293C7.10527 10.314 5.88592 10.8201 6.35007 11.545C6.79143 12.2358 8.19366 12.5435 9.14858 12.775C9.755 12.9221 10.4181 12.9809 11.0751 13.0923L11.9304 13.1714L12.8112 13.2334C13.4857 13.2979 14.1639 13.316 14.841 13.2875C16.6288 13.2875 18.3393 13.1804 19.8356 12.862C20.7901 12.659 21.7083 12.4767 22.4359 12.0572C22.7231 11.8922 23.064 11.7005 23.1494 11.346C23.1682 11.2357 23.1568 11.1225 23.1165 11.0179C23.0761 10.9133 23.0082 10.821 22.9196 10.7503C22.5583 10.3958 22.0541 10.1993 21.5162 10.0153C19.4635 9.31211 16.8793 9.17473 14.1273 9.17099ZM2.46605 18.4472C2.65332 18.5876 2.78467 18.8052 2.97347 18.9501C3.39899 19.2834 3.86502 19.564 4.36095 19.7856C5.03815 20.072 5.7317 20.32 6.43815 20.5283C10.5058 21.7635 17.4309 21.9082 21.8103 20.8223C23.4243 20.4221 24.9192 20.0016 26.0995 19.1899C26.4198 18.9895 26.7038 18.7386 26.9399 18.4472L26.9717 18.4704L27.1303 18.7025C27.2483 18.8913 27.334 19.0977 27.384 19.3136C27.3865 20.3866 27.3892 21.4597 27.3918 22.5328C27.3918 23.2867 27.4456 23.9616 27.154 24.4282C26.4086 25.6215 24.6412 26.2351 23.1266 26.6951C18.5693 28.079 11.0199 28.1076 6.42245 26.7337C5.23526 26.3781 4.13826 25.9964 3.23542 25.3721C3.01092 25.2368 2.80567 25.0732 2.62498 24.8854C2.39151 24.6467 2.20836 24.3654 2.08596 24.0576C1.94924 23.6348 2.02258 22.9492 2.02258 22.4252C2.02526 21.3887 2.02787 20.352 2.03043 19.3151C2.11206 18.9995 2.25988 18.704 2.46452 18.4472H2.46605ZM2.4582 26.702C2.5706 26.747 2.72378 26.9968 2.83082 27.081C3.11142 27.31 3.40812 27.5195 3.71872 27.7079C4.82932 28.3573 6.18673 28.7346 7.60351 29.0848C8.61205 29.3341 9.68511 29.4095 10.7821 29.5956L12.1141 29.7116L13.8345 29.7889H15.0951L15.8721 29.7734L16.6489 29.7502C17.2573 29.6566 17.8976 29.7 18.4803 29.6033L19.2334 29.5258C19.9692 29.3927 20.7172 29.3289 21.4057 29.1623C22.2406 28.9602 23.0504 28.8192 23.7992 28.5357C24.6333 28.2199 25.437 27.9098 26.1141 27.4447C26.3232 27.3014 26.5195 27.1409 26.7008 26.965C26.7706 26.8648 26.8562 26.776 26.9545 26.702L27.113 26.9186C27.2413 27.1097 27.3327 27.3221 27.3826 27.5454C27.3852 28.6207 27.3878 29.6961 27.3905 30.7715C27.3905 31.5531 27.4437 32.2264 27.1368 32.7055C26.3814 33.8846 24.5587 34.5107 23.0391 34.9724C18.3818 36.3866 10.754 36.3176 6.1605 34.9105C4.70217 34.4637 3.00698 33.8466 2.27591 32.7055C1.96953 32.2265 2.02219 31.5529 2.02219 30.7715L2.02851 27.5456C2.0786 27.3223 2.16997 27.1099 2.29812 26.9188L2.4582 26.702Z" fill="black"/><path d="M14.756 9.05796C19.4076 9.05796 23.1785 10.0026 23.1785 11.1679C23.1785 12.3331 19.4076 13.2777 14.756 13.2777C10.1043 13.2777 6.33344 12.3331 6.33344 11.1688C6.33344 10.0044 10.1045 9.05796 14.756 9.05796Z" fill="white"/></svg>';
App.Modules.Sites.Icons.ContextMenuStorageIcon = '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.4377 2.00063C24.3031 1.97944 28.8229 2.48857 32.2771 3.86049C33.6385 4.4011 35.2674 5.14475 35.8313 6.43345C36.0943 7.0349 35.9713 8.28373 35.9713 9.11224V11.4435C36.0028 11.8317 35.9962 12.222 35.9513 12.6091C35.8783 12.9282 35.7388 13.2297 35.5412 13.4949C34.547 14.8491 32.4496 15.5727 30.6092 16.1255C24.9072 17.8384 15.3959 17.8993 9.62264 16.1931C7.66675 15.6149 5.28665 14.8249 4.33101 13.3215C4.19412 13.101 4.09633 12.86 4.04163 12.6084C4.00338 12.2885 3.99668 11.9658 4.02161 11.6446V7.83054C4.02161 7.33678 3.99943 6.82999 4.14218 6.48146C4.57165 5.42706 5.65488 4.81092 6.66816 4.31345C7.94622 3.68587 9.41165 3.27582 10.9605 2.897L12.7782 2.54895C13.5345 2.39067 14.3307 2.36967 15.1144 2.24052L17.3409 2.06709L18.1996 2.02863L19.4377 2.00063ZM19.2689 4.58315L18.5001 4.60251L16.4034 4.7277L14.8859 4.89088C13.4976 5.138 12.1624 5.32612 11.0121 5.77674C10.4256 6.00683 8.89005 6.63718 9.4746 7.54008C10.0304 8.40052 11.7963 8.78377 12.9989 9.07215C13.7626 9.25538 14.5977 9.32857 15.425 9.4673L16.5022 9.56588L17.6115 9.64305C18.4608 9.72342 19.315 9.74594 20.1676 9.71044C22.4192 9.71044 24.5734 9.57707 26.4575 9.18054C27.6596 8.92762 28.8159 8.70056 29.7324 8.17812C30.094 7.9725 30.5233 7.7338 30.6308 7.29225C30.6546 7.15489 30.6402 7.01391 30.5894 6.88362C30.5386 6.7533 30.453 6.63829 30.3415 6.55024C29.8865 6.10871 29.2516 5.86394 28.574 5.63476C25.9891 4.75893 22.7347 4.58781 19.2689 4.58315ZM4.58325 16.1371C4.81906 16.312 4.98449 16.5831 5.22226 16.7635C5.75814 17.1786 6.34504 17.5282 6.96958 17.8042C7.82241 18.1609 8.69585 18.4698 9.58552 18.7292C14.7081 20.2678 23.4293 20.448 28.9446 19.0954C30.9771 18.597 32.8596 18.0732 34.3461 17.0621C34.7496 16.8126 35.1072 16.5 35.4045 16.1371L35.4445 16.166L35.6443 16.4551C35.7929 16.6903 35.9007 16.9474 35.9637 17.2162C35.967 18.5528 35.9703 19.8894 35.9736 21.2259C35.9736 22.165 36.0414 23.0055 35.6741 23.5868C34.7352 25.073 32.5095 25.8372 30.6021 26.4103C24.863 28.134 15.3556 28.1697 9.56573 26.4583C8.07065 26.0155 6.68914 25.54 5.55215 24.7624C5.26943 24.5939 5.01093 24.3901 4.78338 24.1563C4.48936 23.8588 4.25872 23.5086 4.10456 23.1252C3.93238 22.5984 4.02474 21.7447 4.02474 21.092C4.02813 19.8009 4.03142 18.5096 4.03465 17.2181C4.13745 16.825 4.32553 16.4569 4.58325 16.1371ZM4.57334 26.4189C4.71489 26.4749 4.90782 26.786 5.04262 26.8911C5.39599 27.1763 5.76964 27.4371 6.16079 27.6718C7.55943 28.4806 9.2689 28.9506 11.0531 29.3868C12.3232 29.6973 13.6746 29.7912 15.0561 30.0229L16.7335 30.1676L18.9002 30.2638H20.4876L21.4662 30.2445L22.4446 30.2156C23.2106 30.0989 24.017 30.153 24.7507 30.0325L25.6993 29.9361C26.6259 29.7703 27.5679 29.6907 28.435 29.4833C29.4863 29.2315 30.5061 29.0559 31.4493 28.7027C32.4997 28.3095 33.5117 27.9234 34.3645 27.3439C34.6277 27.1654 34.875 26.9654 35.1034 26.7464C35.1912 26.6216 35.2989 26.5111 35.4229 26.4189L35.6224 26.6887C35.784 26.9266 35.899 27.1913 35.9621 27.4694C35.9651 28.8087 35.9684 30.1483 35.972 31.4878C35.972 32.4612 36.039 33.2997 35.6525 33.8964C34.7011 35.3651 32.4056 36.145 30.4918 36.7201C24.6268 38.4815 15.0207 38.3956 9.23587 36.6428C7.39931 36.0865 5.26446 35.3178 4.34379 33.8964C3.95795 33.2999 4.02427 32.4609 4.02427 31.4878L4.03222 27.4696C4.09532 27.1915 4.21038 26.927 4.37176 26.6889L4.57334 26.4189Z" fill="black"/></svg>';
App.Modules.Sites.Icons.ModuleIcon = '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.0018 2L2 8.75318L11.0018 15.5L20 8.75318L11.0018 2ZM29 2L20 8.75318L29 15.5L38 8.75318L29 2ZM2 22.2489L11.0018 28.9978L20 22.2489L11.0018 15.5L2 22.2489ZM29 15.5L20 22.2489L29 28.9978L38 22.2489L29 15.5ZM11.0018 31.2469L20 38L29 31.2469L20 24.5L11.0018 31.2469Z" fill="black"/></svg>';
App.Modules.Sites.Icons.IndexesIcon = '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M13.8898 2C9.53414 2 6 5.16342 6 9.06222C6 11.2668 7.13027 13.2363 8.89903 14.5313C7.13027 15.8263 6 17.7956 6 20.0003C6 22.2047 7.13013 24.174 8.89872 25.469C7.13013 26.7639 6 28.7333 6 30.9377C6 34.8365 9.53414 38 13.8898 38C18.2455 38 21.7797 34.8365 21.7797 30.9377V25.9037C23.0231 26.6362 24.5116 27.0624 26.1102 27.0624C30.4659 27.0624 34 23.8991 34 20.0003C34 17.7956 32.8697 15.8263 31.1009 14.5313C32.8697 13.2363 34 11.2668 34 9.06222C34 5.16342 30.4659 2 26.1102 2H13.8898ZM9.56003 9.06222C9.56003 6.92333 11.5003 5.1866 13.8898 5.1866H18.2197V12.9379H13.8898C11.5003 12.9379 9.56003 11.2011 9.56003 9.06222ZM30.44 9.06222C30.44 11.2011 28.4997 12.9379 26.1102 12.9379H21.7803V5.1866H26.1102C28.4997 5.1866 30.44 6.92333 30.44 9.06222ZM9.56003 20.0003C9.56003 17.8613 11.5003 16.1246 13.8898 16.1246H18.2197V23.8756H13.889L13.8444 23.8757C11.4758 23.8538 9.56003 22.1255 9.56003 20.0003ZM21.7803 20.0003C21.7803 17.8613 23.7206 16.1246 26.1102 16.1246C28.4997 16.1246 30.44 17.8613 30.44 20.0003C30.44 22.1392 28.4997 23.8759 26.1102 23.8759C23.7206 23.8759 21.7803 22.1392 21.7803 20.0003ZM9.56003 30.9377C9.56003 28.8125 11.4758 27.0842 13.8444 27.0623L13.8898 27.0624H18.2197V30.9377C18.2197 33.0767 16.2794 34.8134 13.8898 34.8134C11.5003 34.8134 9.56003 33.0767 9.56003 30.9377Z" fill="black"/></svg>';
App.Modules.Sites.Icons.IndexIcon = '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.2857 10C13.9639 10 15.5482 10.3907 16.9476 11.0837C15.8341 12.3535 14.9541 13.8227 14.3719 15.4285C13.7344 15.153 13.0284 14.9999 12.2857 14.9999C9.44539 14.9999 7.14285 17.2385 7.14285 20C7.14285 22.7613 9.44539 24.9999 12.2857 24.9999C15.126 24.9999 17.4285 22.7613 17.4285 20C17.4285 17.4639 18.3996 15.1483 20 13.3854C21.8848 11.3094 24.6422 10 27.7143 10C33.3949 10 38 14.4772 38 20C38 25.5228 33.3949 30 27.7143 30C24.6422 30 21.8848 28.6905 20 26.6145C18.1152 28.6905 15.3578 30 12.2857 30C6.60507 30 2 25.5228 2 20C2 14.4772 6.60507 10 12.2857 10ZM22.5715 20C22.5715 22.7613 24.874 24.9999 27.7143 24.9999C30.5547 24.9999 32.8572 22.7613 32.8572 20C32.8572 17.2385 30.5547 14.9999 27.7143 14.9999C24.874 14.9999 22.5715 17.2385 22.5715 20Z" fill="black"/></svg>';
App.Modules.Sites.Icons.FieldsIcon = '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M15.5 15.2632C18.3539 15.2632 20.7646 13.2656 21.5392 10.5263H38V6.73684H21.5392C20.7646 3.99755 18.3539 2 15.5 2C12.0206 2 9.20001 4.96905 9.20001 8.63158C9.20001 12.2941 12.0206 15.2632 15.5 15.2632ZM18.2 8.63158C18.2 10.2012 16.9911 11.4737 15.5 11.4737C14.0089 11.4737 12.8 10.2012 12.8 8.63158C12.8 7.06192 14.0089 5.78948 15.5 5.78948C16.9911 5.78948 18.2 7.06192 18.2 8.63158Z" fill="black"/><path fill-rule="evenodd" clip-rule="evenodd" d="M28.1 26.6316C30.9539 26.6316 33.3646 24.634 34.1392 21.8947H38V18.1053H34.1392C33.3646 15.3661 30.9539 13.3684 28.1 13.3684C24.6206 13.3684 21.8 16.3375 21.8 20C21.8 23.6625 24.6206 26.6316 28.1 26.6316ZM28.1 22.8421C29.5911 22.8421 30.8 21.5696 30.8 20C30.8 18.4304 29.5911 17.1579 28.1 17.1579C26.6089 17.1579 25.4 18.4304 25.4 20C25.4 21.5696 26.6089 22.8421 28.1 22.8421Z" fill="black"/><path fill-rule="evenodd" clip-rule="evenodd" d="M11.9 38C15.3794 38 18.2 35.0309 18.2 31.3684C18.2 27.7059 15.3794 24.7368 11.9 24.7368C9.04608 24.7368 6.63538 26.7344 5.86089 29.4737H2V33.2631H5.86089C6.63538 36.0024 9.04608 38 11.9 38ZM11.9 34.2105C13.3911 34.2105 14.6 32.938 14.6 31.3684C14.6 29.7988 13.3911 28.5263 11.9 28.5263C10.4088 28.5263 9.2 29.7988 9.2 31.3684C9.2 32.938 10.4088 34.2105 11.9 34.2105Z" fill="black"/><path d="M20 29.4737H38V33.2632H20V29.4737Z" fill="black"/><path d="M20 18.1052H2V21.8947H20V18.1052Z" fill="black"/><path d="M7.4 6.73682H2V10.5263H7.4V6.73682Z" fill="black"/></svg>';
App.Modules.Sites.Icons.OnChangeIcon = '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.7713 30.9357C13.3965 30.5615 12.7903 30.5615 12.4155 30.9357C12.0407 31.3101 12.0407 31.9154 12.4155 32.2897L13.5002 33.3728H9.09784C6.23477 33.3728 3.91399 31.0473 3.91399 28.196V24.9865C3.91399 24.4609 3.48332 24.0308 2.95696 24.0308C2.4306 24.0308 1.99995 24.4609 1.99995 24.9865V28.196C1.99995 32.1065 5.18203 35.2842 9.09784 35.2842H13.5002L12.4155 36.3674C12.0407 36.7416 12.0407 37.3469 12.4155 37.7212C12.5989 37.9044 12.8462 38 13.0934 38C13.3406 38 13.5799 37.9044 13.7713 37.7212L16.4909 35.0054C16.8656 34.6312 16.8656 34.0259 16.4909 33.6516L13.7713 30.9357Z" fill="black"/><path d="M18.7479 2.00192H3.02888C2.50252 2.00192 2.07185 2.43198 2.07185 2.95763V18.655C2.07185 19.1807 2.50252 19.6108 3.02888 19.6108H18.7479C19.2743 19.6108 19.705 19.1807 19.705 18.655V2.95763C19.705 2.43198 19.2823 2.00192 18.7479 2.00192ZM17.791 17.6992H3.98589V3.91332H17.791V17.6992Z" fill="black"/><path d="M30.8941 4.71777H26.4918L27.5764 3.63465C27.9513 3.26033 27.9513 2.65506 27.5764 2.28074C27.2015 1.90642 26.5954 1.90642 26.2207 2.28074L23.5091 4.99652C23.1342 5.37084 23.1342 5.97612 23.5091 6.35042L26.2285 9.06621C26.412 9.24939 26.6592 9.34495 26.9065 9.34495C27.1537 9.34495 27.393 9.24939 27.5844 9.06621C27.9591 8.69189 27.9591 8.08661 27.5844 7.71229L26.4997 6.62918H30.9021C33.7652 6.62918 36.0858 8.95471 36.0858 11.8059V15.0154C36.0858 15.5411 36.5165 15.9712 37.0429 15.9712C37.5693 15.9712 38 15.5411 38 15.0154V11.8059C38 7.89547 34.8098 4.71777 30.8941 4.71777Z" fill="black"/><path d="M36.9713 36.0886C36.716 36.0886 36.4687 36.1922 36.2933 36.3674C36.1179 36.5426 36.0142 36.7895 36.0142 37.0444C36.0142 37.2911 36.1179 37.546 36.2933 37.7212C36.4687 37.8966 36.716 38 36.9713 38C37.2264 38 37.4736 37.8966 37.6492 37.7212C37.8246 37.546 37.9282 37.2991 37.9282 37.0444C37.9282 36.7895 37.8246 36.5426 37.6492 36.3674C37.4658 36.1922 37.2185 36.0886 36.9713 36.0886Z" fill="black"/><path d="M33.0393 36.0886C32.513 36.0886 32.0823 36.5187 32.0823 37.0444C32.0823 37.5699 32.513 38 33.0393 38C33.5657 38 33.9964 37.5699 33.9964 37.0444C33.9964 36.5187 33.5657 36.0886 33.0393 36.0886Z" fill="black"/><path d="M25.1757 36.0886C24.6493 36.0886 24.2187 36.5187 24.2187 37.0444C24.2187 37.5699 24.6493 38 25.1757 38C25.7022 38 26.1327 37.5699 26.1327 37.0444C26.1327 36.5187 25.71 36.0886 25.1757 36.0886Z" fill="black"/><path d="M29.1075 36.0886C28.5811 36.0886 28.1506 36.5187 28.1506 37.0444C28.1506 37.5699 28.5811 38 29.1075 38C29.6339 38 30.0646 37.5699 30.0646 37.0444C30.0646 36.5187 29.6339 36.0886 29.1075 36.0886Z" fill="black"/><path d="M21.2523 36.0886C20.997 36.0886 20.7498 36.1922 20.5744 36.3674C20.3989 36.5426 20.2952 36.7895 20.2952 37.0444C20.2952 37.2911 20.3989 37.546 20.5744 37.7212C20.7498 37.8966 20.997 38 21.2523 38C21.4995 38 21.7546 37.8966 21.9301 37.7212C22.1056 37.546 22.2092 37.2991 22.2092 37.0444C22.2092 36.7895 22.1056 36.5426 21.9301 36.3674C21.7546 36.1922 21.4994 36.0886 21.2523 36.0886Z" fill="black"/><path d="M21.2523 32.1623C20.7259 32.1623 20.2952 32.5924 20.2952 33.118C20.2952 33.6437 20.7259 34.0737 21.2523 34.0737C21.7785 34.0737 22.2092 33.6437 22.2092 33.118C22.2092 32.5924 21.7785 32.1623 21.2523 32.1623Z" fill="black"/><path d="M21.2523 28.2359C20.7259 28.2359 20.2952 28.666 20.2952 29.1916C20.2952 29.7172 20.7259 30.1472 21.2523 30.1472C21.7785 30.1472 22.2092 29.7172 22.2092 29.1916C22.2092 28.666 21.7785 28.2359 21.2523 28.2359Z" fill="black"/><path d="M21.2523 24.3097C20.7259 24.3097 20.2952 24.7398 20.2952 25.2653C20.2952 25.791 20.7259 26.2211 21.2523 26.2211C21.7785 26.2211 22.2092 25.791 22.2092 25.2653C22.2092 24.7398 21.7785 24.3097 21.2523 24.3097Z" fill="black"/><path d="M21.2523 20.3912C20.997 20.3912 20.7498 20.4948 20.5744 20.67C20.3989 20.8451 20.2952 21.0921 20.2952 21.347C20.2952 21.6019 20.3989 21.8486 20.5744 22.024C20.7498 22.1991 20.997 22.3027 21.2523 22.3027C21.4995 22.3027 21.7546 22.1991 21.9301 22.024C22.1056 21.8486 22.2092 21.6019 22.2092 21.347C22.2092 21.1001 22.1056 20.8451 21.9301 20.67C21.7466 20.4868 21.4994 20.3912 21.2523 20.3912Z" fill="black"/><path d="M33.0393 20.3912C32.513 20.3912 32.0823 20.8213 32.0823 21.347C32.0823 21.8727 32.513 22.3027 33.0393 22.3027C33.5657 22.3027 33.9964 21.8727 33.9964 21.347C33.9964 20.8213 33.5657 20.3912 33.0393 20.3912Z" fill="black"/><path d="M29.1075 20.3912C28.5811 20.3912 28.1506 20.8213 28.1506 21.347C28.1506 21.8727 28.5811 22.3027 29.1075 22.3027C29.6339 22.3027 30.0646 21.8727 30.0646 21.347C30.0646 20.8213 29.6339 20.3912 29.1075 20.3912Z" fill="black"/><path d="M25.1757 20.3912C24.6493 20.3912 24.2187 20.8213 24.2187 21.347C24.2187 21.8727 24.6493 22.3027 25.1757 22.3027C25.7022 22.3027 26.1327 21.8727 26.1327 21.347C26.1327 20.8213 25.71 20.3912 25.1757 20.3912Z" fill="black"/><path d="M36.9713 20.3912C36.716 20.3912 36.4687 20.4948 36.2933 20.67C36.1179 20.8451 36.0142 21.0921 36.0142 21.347C36.0142 21.6019 36.1179 21.8486 36.2933 22.024C36.4687 22.1991 36.716 22.3027 36.9713 22.3027C37.2264 22.3027 37.4736 22.1991 37.6492 22.024C37.8246 21.8486 37.9282 21.6019 37.9282 21.347C37.9282 21.1001 37.8246 20.8451 37.6492 20.67C37.4658 20.4948 37.2185 20.3912 36.9713 20.3912Z" fill="black"/><path d="M36.9713 24.3097C36.4448 24.3097 36.0142 24.7398 36.0142 25.2653C36.0142 25.791 36.4448 26.2211 36.9713 26.2211C37.4975 26.2211 37.9282 25.791 37.9282 25.2653C37.9282 24.7398 37.4975 24.3097 36.9713 24.3097Z" fill="black"/><path d="M36.9713 32.1623C36.4448 32.1623 36.0142 32.5924 36.0142 33.118C36.0142 33.6437 36.4448 34.0737 36.9713 34.0737C37.4975 34.0737 37.9282 33.6437 37.9282 33.118C37.9282 32.5924 37.4975 32.1623 36.9713 32.1623Z" fill="black"/><path d="M36.9713 28.2359C36.4448 28.2359 36.0142 28.666 36.0142 29.1916C36.0142 29.7172 36.4448 30.1472 36.9713 30.1472C37.4975 30.1472 37.9282 29.7172 37.9282 29.1916C37.9282 28.666 37.4975 28.2359 36.9713 28.2359Z" fill="black"/></svg>';
App.Modules.Sites.Icons.ValueGenerator = '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M35.2987 2.00161H4.70138C4.34346 1.98904 3.98676 2.05027 3.65353 2.18151C3.32029 2.31273 3.01764 2.51114 2.76438 2.76438C2.51114 3.01764 2.31273 3.32029 2.18151 3.65353C2.05027 3.98676 1.98904 4.34346 2.00161 4.70138V35.2987C1.98904 35.6566 2.05027 36.0133 2.18151 36.3464C2.31273 36.6798 2.51114 36.9823 2.76438 37.2356C3.01764 37.489 3.32029 37.6873 3.65353 37.8185C3.98676 37.9497 4.34346 38.011 4.70138 37.9984H35.2987C35.6566 38.011 36.0133 37.9497 36.3464 37.8185C36.6798 37.6873 36.9823 37.489 37.2356 37.2356C37.489 36.9823 37.6873 36.6798 37.8185 36.3464C37.9497 36.0133 38.011 35.6566 37.9984 35.2987V4.70138C38.011 4.34346 37.9497 3.98676 37.8185 3.65353C37.6873 3.32029 37.489 3.01764 37.2356 2.76438C36.9823 2.51114 36.6798 2.31273 36.3464 2.18151C36.0133 2.05027 35.6566 1.98904 35.2987 2.00161ZM34.3987 34.3987H5.60129V5.60129H34.3987V34.3987Z" fill="black"/><path d="M11.0008 12.8007H28.9992C29.4765 12.8007 29.9344 12.611 30.272 12.2735C30.6094 11.9359 30.799 11.4781 30.799 11.0008C30.799 10.5235 30.6094 10.0657 30.272 9.72812C29.9344 9.39059 29.4765 9.20097 28.9992 9.20097H11.0008C10.5235 9.20097 10.0657 9.39059 9.72812 9.72812C9.39059 10.0657 9.20097 10.5235 9.20097 11.0008C9.20097 11.4781 9.39059 11.9359 9.72812 12.2735C10.0657 12.611 10.5235 12.8007 11.0008 12.8007Z" fill="black"/><path d="M22.9697 16.2203V16.0403C22.6344 15.5933 22.1996 15.2305 21.6997 14.9804C21.1999 14.7306 20.6488 14.6005 20.09 14.6005C19.5312 14.6005 18.9799 14.7306 18.4801 14.9804C17.9802 15.2305 17.5454 15.5933 17.2101 16.0403L10.3708 28.0993C10.2188 28.4968 10.2127 28.9353 10.3534 29.3371C10.4941 29.7386 10.7726 30.0775 11.1394 30.2932C11.5063 30.509 11.9377 30.5879 12.3571 30.5157C12.7766 30.4436 13.1569 30.2251 13.4305 29.8992L14.9603 27.1993H25.0395L26.5693 29.8992C26.6628 30.1435 26.8084 30.3645 26.9959 30.5468C27.1834 30.7293 27.4086 30.8685 27.6555 30.9551C27.9023 31.0415 28.1651 31.0733 28.4254 31.0477C28.686 31.0224 28.9376 30.9404 29.1631 30.8078C29.3886 30.6751 29.5825 30.495 29.7313 30.2798C29.88 30.0644 29.98 29.8195 30.0243 29.5616C30.0687 29.3039 30.0563 29.0394 29.988 28.7868C29.9198 28.5343 29.7972 28.2996 29.6292 28.0993L22.9697 16.2203ZM17.0301 23.5997L20 18.2902L22.9697 23.5997H17.0301Z" fill="black"/></svg>';
App.Modules.Sites.Icons.Attrs = '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.6923 26.9231C10.9169 26.9231 10.3077 27.5323 10.3077 28.3077C10.3077 29.0831 10.9169 29.6923 11.6923 29.6923C12.4677 29.6923 13.0769 29.0831 13.0769 28.3077C13.0769 27.5323 12.4677 26.9231 11.6923 26.9231ZM11.6923 10.3077C10.9169 10.3077 10.3077 10.9169 10.3077 11.6923C10.3077 12.4677 10.9169 13.0769 11.6923 13.0769C12.4677 13.0769 13.0769 12.4677 13.0769 11.6923C13.0769 10.9169 12.4677 10.3077 11.6923 10.3077ZM11.6923 18.6154C10.9169 18.6154 10.3077 19.2245 10.3077 20C10.3077 20.7754 10.9169 21.3846 11.6923 21.3846C12.4677 21.3846 13.0769 20.7754 13.0769 20C13.0769 19.2245 12.4677 18.6154 11.6923 18.6154ZM32.4616 2H7.53846C4.4923 2 2 4.4923 2 7.53845V32.4615C2 35.5076 4.4923 38 7.53846 38H32.4616C35.5076 38 38 35.5076 38 32.4615V7.53845C38 4.4923 35.5076 2 32.4616 2ZM35.2308 32.4615C35.2308 33.9846 33.9846 35.2306 32.4616 35.2306H7.53846C6.01537 35.2306 4.76922 33.9846 4.76922 32.4615V7.53845C4.76922 6.01537 6.01537 4.76922 7.53846 4.76922H32.4616C33.9846 4.76922 35.2308 6.01537 35.2308 7.53845V32.4615ZM28.3077 10.3077H17.2307C16.4553 10.3077 15.8461 10.9169 15.8461 11.6923C15.8461 12.4677 16.4553 13.0769 17.2307 13.0769H28.3077C29.0831 13.0769 29.6923 12.4677 29.6923 11.6923C29.6923 10.9169 29.0831 10.3077 28.3077 10.3077ZM28.3077 18.6154H17.2307C16.4553 18.6154 15.8461 19.2245 15.8461 20C15.8461 20.7754 16.4553 21.3846 17.2307 21.3846H28.3077C29.0831 21.3846 29.6923 20.7754 29.6923 20C29.6923 19.2245 29.0831 18.6154 28.3077 18.6154ZM28.3077 26.9231H17.2307C16.4553 26.9231 15.8461 27.5323 15.8461 28.3077C15.8461 29.0831 16.4553 29.6923 17.2307 29.6923H28.3077C29.0831 29.6923 29.6923 29.0831 29.6923 28.3077C29.6923 27.5323 29.0831 26.9231 28.3077 26.9231Z" fill="black"/></svg>';

const Sites = new App.Modules.Sites();
