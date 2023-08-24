<?php

namespace App\Modules\Sites\Controllers;

use App\Modules\Security\Module as SecurityModule;
use App\Modules\Sites\Models\Publications;
use Colibri\Common\StringHelper;
use Colibri\Common\VariableHelper;
use Colibri\Data\SqlClient\QueryInfo;
use Colibri\Data\Storages\Storages;
use Colibri\Exceptions\ApplicationErrorException;
use Colibri\Exceptions\BadRequestException;
use Colibri\Exceptions\PermissionDeniedException;
use Colibri\Exceptions\ValidationException;
use Colibri\Web\Controller as WebController;
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

        $searchFilters = [];
        $filterFields = VariableHelper::ToJsonFilters($filterFields);
        foreach($filterFields as $key => $value) {
            $exploded = StringHelper::Explode($key, ['[', '.'], true);
            $fieldName = $exploded[0];
            $filterKey = substr($key, strlen($fieldName));
            $searchFilters[$fieldName] = ['$'.$filterKey, $value];
        }

        $storage = Storages::Create()->Load($storage);
        [$tableClass, $rowClass] = $storage->GetModelClasses();

        $filters = [];
        $params = [];
        if($term) {
            foreach ($storage->fields as $field) {
                if ($field->class === 'string') {
                    $filters[] = '{' . $field->name . '} like [[term:string]]';
                }
            }
            $params['term'] = '%' . $term . '%';
        }


        foreach($searchFilters as $fieldName => $filterData) {
            $fieldPath = str_replace('.', '/', $filterData[0]);
            $fieldPath = str_replace('$', '', $fieldPath);
            $fieldPath = preg_replace('/\[\d+\]/', '', $fieldPath);

            $mainField = $storage->GetField($fieldName);
            $field = null;
            if($fieldPath) {
                $field = $storage->GetField(str_replace('//', '/', $fieldName . '/' . $fieldPath));
            }

            if($mainField->type === 'json') {
                $isDate = in_array($field->component, ['Colibri.UI.Forms.Date', 'Colibri.UI.Forms.DateTime']);
                $spl = '\'';
                $fname = 'JSON_EXTRACT({'.$fieldName.'}, \''.$filterData[0].'\')';
                if(in_array($field->component, [
                    'Colibri.UI.Forms.Date',
                    'Colibri.UI.Forms.DateTime',
                    'Colibri.UI.Forms.Number'
                ])) {
                    $filters[] =
                        $fname . ' >= ' . $spl . $filterData[1][0] . $spl .
                        (isset($filterData[1][1]) ?
                            ' and ' . $fname . ' <= ' . $spl . $filterData[1][1] . $spl : ''
                        );
                } else {
                    $filters[] =
                        $fname . ' in (' .
                            $spl . implode($spl . ',' . $spl, $filterData[1]) . $spl .
                        ')';

                }


            } else {

                if(in_array($field->component, [
                    'Colibri.UI.Forms.Date',
                    'Colibri.UI.Forms.DateTime',
                    'Colibri.UI.Forms.Number'
                ])) {
                    $filters[] = '{' . $fieldName . '} between [['.
                        $fieldName.'0:'.$mainField->param.']] and [['.
                        $fieldName.'1:'.$mainField->param.']]';
                    $params[$fieldName.'0'] = $filterData[1][0];
                    $params[$fieldName.'1'] = $filterData[1][1];

                } else {
                    $values = $filterData[1];
                    if(!is_array($values)) {
                        $values = [$values];
                    }
                    foreach($values as $index => $value) {
                        $eq = '=';
                        if($mainField->param === 'string') {
                            $eq = 'like';
                        }
                        $filters[] = '{' . $fieldName . '} '.$eq.' [['.$fieldName.$index.':'.$mainField->param.']]';
                        $params[$fieldName.$index] = $filterData[1];
                    }
                }

            }


        }

        if (!$sortField) {
            $sortField = '{datecreated}';
        } else {
            $sortField = '{' . $sortField . '}';
        }
        if (!$sortOrder) {
            $sortOrder = 'asc';
        }

        if (!empty($params)) {
            $datarows = $tableClass::LoadByFilter(
                $page,
                $pagesize,
                implode(' or ', $filters),
                $sortField . ' ' . $sortOrder,
                $params
            );
        } else {
            $datarows = $tableClass::LoadByFilter(
                $page,
                $pagesize,
                !empty($filters) ? implode(' ane ', $filters) : '',
                $sortField . ' ' . $sortOrder
            );
        }
        if (!$datarows) {
            throw new BadRequestException(BadRequestException::BadRequestExceptionMessage, 400);
        }

        $dataArray = [];
        foreach ($datarows as $datarow) {
            $dataArray[] = $datarow->ToArray(true);
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

        if (!SecurityModule::$instance->current->IsCommandAllowed('sites.storages.' . $storage . ($data->id ?? 0 ? '.edit' : '.add'))) {
            throw new PermissionDeniedException(PermissionDeniedException::PermissionDeniedMessage, 403);
        }


        $storage = Storages::Create()->Load($storage);
        [$tableClass, $rowClass] = $storage->GetModelClasses();

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


}
