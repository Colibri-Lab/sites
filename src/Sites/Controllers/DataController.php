<?php

namespace App\Modules\Sites\Controllers;

use App\Modules\Security\Module as SecurityModule;
use App\Modules\Sites\Models\Publications;
use Colibri\App;
use Colibri\Common\StringHelper;
use Colibri\Common\VariableHelper;
use Colibri\Data\DataAccessPoint;
use Colibri\Data\SqlClient\QueryInfo;
use Colibri\Data\Storages\Storages;
use Colibri\Exceptions\ApplicationErrorException;
use Colibri\Exceptions\BadRequestException;
use Colibri\Exceptions\PermissionDeniedException;
use Colibri\Exceptions\ValidationException;
use Colibri\IO\FileSystem\File;
use Colibri\Web\Controller as WebController;
use Colibri\Web\PayloadCopy;
use Colibri\Web\RequestCollection;
use InvalidArgumentException;

/**
 * Data controller
 */
class DataController extends WebController
{
    /**
     * Returns a list of rows
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param mixed|null $payload
     * @return object
     */
    public function List(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        if (!SecurityModule::$instance->current) {
            throw new PermissionDeniedException(PermissionDeniedException::PermissionDeniedMessage, 403);
        }

        $storage = $post->{'storage'};
        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . $storage . '.list')) {
            throw new PermissionDeniedException(PermissionDeniedException::PermissionDeniedMessage, 403);
        }

        $term = $post->{'term'};
        $filterFields = $post->{'filters'};
        $sortField = $post->{'sortfield'};
        $sortOrder = $post->{'sortorder'};
        $page = (int) $post->{'page'} ?: 1;
        $pagesize = (int) $post->{'pagesize'} ?: 20;

        $storage = Storages::Create()->Load($storage);
        [$tableClass, $rowClass] = $storage->GetModelClasses();
        if($storage->isSoftDelete && $storage->isShowDeletedRows) {
            $tableClass::SetFullSelect(true);
        }

        $datarows = $tableClass::LoadBy($page, $pagesize, $term, $filterFields, $sortField ?? '', $sortOrder ?? 'asc');
        if (!$datarows) {
            throw new BadRequestException(BadRequestException::BadRequestExceptionMessage, 400);
        }

        $dataArray = [];
        foreach ($datarows as $datarow) {
            $dataArray[] = $datarow->ToArray(true);
        }

        if($storage->isSoftDelete && $storage->isShowDeletedRows) {
            $tableClass::SetFullSelect(false);
        }

        return $this->Finish(200, 'ok', $dataArray);


    }

    /**
     * Returns a row full data
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param mixed|null $payload
     * @return object
     */
    public function Row(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        if (!SecurityModule::$instance->current) {
            throw new PermissionDeniedException(PermissionDeniedException::PermissionDeniedMessage, 403);
        }

        $storage = $post->{'storage'};
        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . $storage . '.list')) {
            throw new PermissionDeniedException(PermissionDeniedException::PermissionDeniedMessage, 403);
        }

        $id = $post->{'row'};

        $storage = Storages::Create()->Load($storage);
        if (!$storage) {
            throw new BadRequestException('Bad request', 400);
        }
        [$tableClass, $rowClass] = $storage->GetModelClasses();
        $datarow = $tableClass::LoadById($id);
        if (!$datarow) {
            throw new BadRequestException('Bad request', 400);
        }

        return $this->Finish(200, 'ok', $datarow->ToArray(true));

    }

    /**
     * Saves a row data
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param mixed|null $payload
     * @throws InvalidArgumentException
     * @return object
     */
    public function Save(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {
        if (!SecurityModule::$instance->current) {
            throw new PermissionDeniedException(PermissionDeniedException::PermissionDeniedMessage, 403);
        }

        $storage = $post->{'storage'};
        $data = (object) $post->{'data'};
        $pub = $post->{'pub'};

        if (!SecurityModule::$instance->current->IsCommandAllowed(
            'sites.storages.' . $storage . ($data->id ?? 0 ? '.edit' : '.add')
        )) {
            throw new PermissionDeniedException(PermissionDeniedException::PermissionDeniedMessage, 403);
        }


        $storage = Storages::Create()->Load($storage);
        [$tableClass, ] = $storage->GetModelClasses();

        if ($data->id ?? 0) {
            $datarow = $tableClass::LoadById($data->id);
            if (!$datarow) {
                throw new BadRequestException('Bad request', 400);
            }
        } else {
            $datarow = $tableClass::LoadEmpty();
        }

        foreach ($data as $key => $value) {
            if(!in_array($key, ['id','datecreated','datemodified'])) {
                $datarow->$key = $value;
            }
        }

        $accessPoint = $datarow->Storage()->accessPoint;
        $accessPoint->Begin();

        try {
            /** @var QueryInfo $res */
            if (($res = $datarow->Save(true)) !== true) {
                throw new InvalidArgumentException($res->error, 400);
            }

            if ($pub) {
                $pub = Publications::LoadById($pub);
                if (($res = $pub->Save(true)) !== true) {
                    throw new InvalidArgumentException($res->error, 400);
                }
                $pub = $pub->ToArray(true);
            }


        } catch (InvalidArgumentException $e) {
            $accessPoint->Rollback();
            throw new BadRequestException($e->getMessage(), 400, $e);
        } catch (ValidationException $e) {
            $accessPoint->Rollback();
            throw new ApplicationErrorException($e->getMessage(), 500, $e);
        } catch (\Throwable $e) {
            $accessPoint->Rollback();
            throw new ApplicationErrorException($e->getMessage(), 500, $e);
        }

        $accessPoint->Commit();

        return $this->Finish(200, 'ok', ['datarow' => $datarow->ToArray(true), 'pub' => $pub]);

    }

    /**
     * Deletes a row
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param mixed|null $payload
     * @return object
     */
    public function Delete(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if (!SecurityModule::$instance->current) {
            throw new PermissionDeniedException(PermissionDeniedException::PermissionDeniedMessage, 403);
        }

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.pubs.add')) {
            throw new PermissionDeniedException(PermissionDeniedException::PermissionDeniedMessage, 403);
        }

        $storage = $post->{'storage'};
        if (!$storage) {
            throw new BadRequestException('Bad request', 400);
        }

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . $storage . '.remove')) {
            throw new PermissionDeniedException(PermissionDeniedException::PermissionDeniedMessage, 403);
        }

        $ids = $post->{'ids'};
        if (!$ids) {
            throw new BadRequestException('Bad request', 400);
        }

        $storage = Storages::Create()->Load($storage);
        [$tableClass, $rowClass] = $storage->GetModelClasses();

        if (!$tableClass::DeleteAllByIds(explode(',', $ids))) {
            throw new BadRequestException('Bad request', 400);
        }

        return $this->Finish(200, 'ok');
    }

    /**
     * Cleares the storage
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param mixed|null $payload
     * @return object
     */
    public function Clear(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if (!SecurityModule::$instance->current) {
            throw new PermissionDeniedException(PermissionDeniedException::PermissionDeniedMessage, 403);
        }

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.pubs.add')) {
            throw new PermissionDeniedException(PermissionDeniedException::PermissionDeniedMessage, 403);
        }

        $storage = $post->{'storage'};
        if (!$storage) {
            throw new BadRequestException('Bad request', 400);
        }

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . $storage . '.remove')) {
            throw new PermissionDeniedException(PermissionDeniedException::PermissionDeniedMessage, 403);
        }

        $storage = Storages::Create()->Load($storage);
        [$tableClass, $rowClass] = $storage->GetModelClasses();

        if (!$tableClass::DeleteAllByFilter('')) {
            throw new BadRequestException('Bad request', 400);
        }

        return $this->Finish(200, 'ok');
    }

    /**
     * Restore a row
     * @param RequestCollection $get
     * @param RequestCollection $post
     * @param mixed|null $payload
     * @return object
     */
    public function Restore(RequestCollection $get, RequestCollection $post, mixed $payload = null): object
    {

        if (!SecurityModule::$instance->current) {
            throw new PermissionDeniedException(PermissionDeniedException::PermissionDeniedMessage, 403);
        }

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.structure.pubs.add')) {
            throw new PermissionDeniedException(PermissionDeniedException::PermissionDeniedMessage, 403);
        }

        $storage = $post->{'storage'};
        if (!$storage) {
            throw new BadRequestException('Bad request', 400);
        }

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . $storage . '.remove')) {
            throw new PermissionDeniedException(PermissionDeniedException::PermissionDeniedMessage, 403);
        }

        $ids = $post->{'ids'};
        if (!$ids) {
            throw new BadRequestException('Bad request', 400);
        }

        $storage = Storages::Create()->Load($storage);
        [$tableClass, $rowClass] = $storage->GetModelClasses();

        if (!$tableClass::RestoreAllByIds(explode(',', $ids))) {
            throw new BadRequestException('Bad request', 400);
        }

        return $this->Finish(200, 'ok');
    }


    /**
     * Exports a data to file
     * @param RequestCollection $get данные GET
     * @param RequestCollection $post данные POST
     * @param mixed $payload данные payload обьекта переданного через POST/PUT
     * @return object
     */
    public function Export(RequestCollection $get, RequestCollection $post, ? PayloadCopy $payload = null): object
    {

        if (!SecurityModule::$instance->current) {
            throw new PermissionDeniedException(PermissionDeniedException::PermissionDeniedMessage, 403);
        }

        $storage = $post->{'storage'};
        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . $storage . '.list')) {
            throw new PermissionDeniedException(PermissionDeniedException::PermissionDeniedMessage, 403);
        }

        $term = $post->{'term'};
        $filterFields = $post->{'filters'};
        $sortField = $post->{'sortfield'};
        $sortOrder = $post->{'sortorder'};


        $storage = Storages::Create()->Load($storage);
        [$tableClass, $rowClass] = $storage->GetModelClasses();

        $datarows = $tableClass::LoadBy(-1, 20, $term, $filterFields, $sortField ?? '', $sortOrder ?? 'asc');

        $cacheUrl = App::$config->Query('cache')->GetValue();
        $cachePath = App::$webRoot . $cacheUrl;
        $fileName = 'export' . microtime(true) . '.xml.xls';
        $datarows->ExportXML($cachePath . $fileName);

        $result = [
            'filename' => '/' . $cacheUrl . $fileName,
            'filecontent' => base64_encode(File::Read($cachePath . $fileName))
        ];
        
        return $this->Finish(200, 'ok', $result);

    }


    
    /**
     * Saves a data list
     * @param RequestCollection $get данные GET
     * @param RequestCollection $post данные POST
     * @param mixed $payload данные payload обьекта переданного через POST/PUT
     * @return object
     */
    public function SaveDataList(RequestCollection $get, RequestCollection $post, ? PayloadCopy $payload = null): object
    {

        if (!SecurityModule::$instance->current) {
            throw new PermissionDeniedException(PermissionDeniedException::PermissionDeniedMessage, 403);
        }

        $storage = $post->{'storage'};
        $dataList = (array) $post->{'data'};

        $storage = Storages::Create()->Load($storage);
        [$tableClass, ] = $storage->GetModelClasses();

        $accessPoint = $storage->accessPoint;
        $accessPoint->Begin();
        try {

            $ret = [];
            foreach($dataList as $data) {
                $data = (object)$data;

                if (!SecurityModule::$instance->current->IsCommandAllowed(
                    'sites.storages.' . $storage->name . ($data->id ?? 0 ? '.edit' : '.add')
                )) {
                    throw new PermissionDeniedException(PermissionDeniedException::PermissionDeniedMessage, 403);
                }
        
                if ($data->id ?? 0) {
                    $datarow = $tableClass::LoadById($data->id);
                    if (!$datarow) {
                        throw new BadRequestException('Bad request', 400);
                    }
                } else {
                    $datarow = $tableClass::LoadEmpty();
                }
        
                foreach ($data as $key => $value) {
                    $datarow->$key = $value;
                }
        
                /** @var QueryInfo $res */
                if (($res = $datarow->Save(true)) !== true) {
                    throw new InvalidArgumentException($res->error, 400);
                }

                $ret[] = $datarow->ToArray(true);
                
            }
            
        } catch (InvalidArgumentException $e) {
            $accessPoint->Rollback();
            throw new BadRequestException($e->getMessage(), 400, $e);
        } catch (ValidationException $e) {
            $accessPoint->Rollback();
            throw new ApplicationErrorException($e->getMessage(), 500, $e);
        } catch (\Throwable $e) {
            $accessPoint->Rollback();
            throw new ApplicationErrorException($e->getMessage(), 500, $e);
        }

        $accessPoint->Commit();

        return $this->Finish(200, 'ok', $ret);

    }


    
}
