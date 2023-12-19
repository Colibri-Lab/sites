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

        $storage = Storages::Create()->Load($storage);
        [$tableClass, $rowClass] = $storage->GetModelClasses();

        $filterFields = VariableHelper::ToJsonFilters($filterFields);

        $searchFilters = [];
        foreach($filterFields as $key => $filterData) {
            $parts = StringHelper::Explode($key, ['[', '.']);
            $fieldName = $parts[0];
            $filterPath = substr($key, strlen($fieldName));
            $filterPath = '$'.str_replace('[0]', '[*]', $filterPath);

            if($filterPath === '$') {
                $searchFilters[$fieldName] = $filterData;
            } else {
                if(!isset($searchFilters[$fieldName])) {
                    $searchFilters[$fieldName] = [];
                }
                $searchFilters[$fieldName][$filterPath] = $filterData;
            }
        }

        $jsonTables = [];
        $fields = [];
        $fieldIndex = 0;
        foreach($searchFilters as $fieldName => $fieldParams) {
            $field = $storage->GetField($fieldName);
            if($field->type === 'json') {
                foreach($fieldParams as $path => $value) {
                    $jsonTables[] = '
                        inner join (
                            select
                                {id} as t_'.$fieldIndex.'_id, t_'.$fieldIndex.'.json_field_'.$fieldIndex.'
                            from '.$storage->table.', json_table(
                                {'.$fieldName.'},
                                \''.$path.'\'
                                columns (
                                    json_field_'.$fieldIndex.' varchar(1024) path \'$\'
                                )
                            ) t_'.$fieldIndex.'
                        ) json_table_'.$fieldIndex.' on '.
                        'json_table_'.$fieldIndex.'.t_'.$fieldIndex.'_id='.$storage->table.'.{id}';

                    $fieldPath = str_replace('[*]', '', $path);
                    $fieldPath = str_replace('$', '', $fieldPath);
                    $fieldPath = str_replace('.', '/', $fieldPath);
                    $fieldPath = str_replace('//', '/', $fieldName . '/' . $fieldPath);
                    $fields['json_field_'.$fieldIndex] = [$storage->GetField($fieldPath), $value];
                    $fieldIndex++;
                }
            } else {
                $fields[$fieldName] = [$field, $fieldParams];
            }
        }

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

        foreach($fields as $fieldName => $fieldData) {
            $field = $fieldData[0];
            $value = $fieldData[1];

            if(in_array($field->component, [
                'Colibri.UI.Forms.Date',
                'Colibri.UI.Forms.DateTime',
                'Colibri.UI.Forms.Number'
            ])) {
                $filters[] = (strstr($fieldName, 'json_') !== false ? $fieldName : '{' . $fieldName . '}').
                    ' between [['.
                        $fieldName . '0:' . $field->param . ']] and [[' .
                        $fieldName . '1:' . $field->param . ']]';
                $params[$fieldName.'0'] = $value[0];
                $params[$fieldName.'1'] = $value[1];
            } else {
                if(!is_array($value)) {
                    $value = [$value];
                }
                $flts = [];
                foreach($value as $index => $v) {
                    $eq = '=';
                    if($field->param === 'string') {
                        $eq = 'like';
                    }
                    $flts[] = (strstr($fieldName, 'json_') !== false ? $fieldName :
                        '{' . $fieldName . '}').' '.$eq.' [['.$fieldName.$index.':'.$field->param.']]';
                    $params[$fieldName.$index] = $v;
                }
                $filters[] = implode(' or ', $flts);
            }

        }


        if(!empty($jsonTables)) {
            $params['__jsonTables'] = $jsonTables;
        }

        if (!$sortField) {
            $sortField = '{id}';
        } else {
            $sortField = '{' . $sortField . '}';
        }
        if (!$sortOrder) {
            $sortOrder = 'asc';
        }

        $datarows = $tableClass::LoadByFilter(
            $page,
            $pagesize,
            implode(' or ', $filters),
            $sortField . ' ' . $sortOrder,
            $params
        );

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
