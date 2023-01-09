<?php

namespace App\Modules\Sites\Models;

use Colibri\Data\MySql\QueryInfo;
use Colibri\Data\Storages\Fields\DateTimeField;
use Colibri\Data\Storages\Models\DataRow as BaseModelDataRow;
use App\Modules\Sites\Models\Page;
use Colibri\Data\Storages\Storage;
use Colibri\Data\Storages\Fields\ObjectField;
use Colibri\Data\Storages\Storages;
use Colibri\Web\Templates\PhpTemplate;
use Colibri\Web\Templates\Template;
use Colibri\Utils\ExtendedObject;
use InvalidArgumentException;

/**
 * Представление строки в таблице в хранилище Публикации
 * @author <author name and email>
 * @package App\Modules\Sites\Models
 * 
 * region Properties:
 * @property-read int $id ID строки
 * @property-read DateTimeField $datecreated Дата создания строки
 * @property-read DateTimeField $datemodified Дата последнего обновления строки
 * @property Domain $domain Домен
 * @property Page|null $page Страница
 * @property string $storage Хранилище материалов
 * @property int $row ID записи в хранилище
 * @property string|null $ft Полнотекстовый поиск
 * @property ObjectField|null $object Данные строки
 * @property float|null $order Позиция в рамках страницы
 * endregion Properties;
 */
class Publication extends BaseModelDataRow
{

    public const JsonSchema = [
        'type' => 'object',
        'required' => [
            'id',
            'datecreated',
            'datemodified',
            # region SchemaRequired:
			'domain',
			'storage',
			'row',
			# endregion SchemaRequired;
        ],
        'properties' => [
            'id' => ['type' => 'integer'],
            'datecreated' => ['type' => 'string', 'format' => 'db-date-time'],
            'datemodified' => ['type' => 'string', 'format' => 'db-date-time'],
            # region SchemaProperties:
			'domain' => Domain::JsonSchema,
			'page' => [ 'oneOf' => [ [ 'type' => 'null'], Page::JsonSchema ] ],
			'storage' => ['type' => 'string', 'maxLength' => 255, ],
			'row' => ['type' => 'integer', ],
			'ft' => [ 'oneOf' => [ [ 'type' => 'null'], ['type' => 'string', ] ] ],
			'object' => ['type' => 'object', 'required' => [], 'properties' => ['patternProperties' => ['.*' => ['type' => ['number','string','boolean','object','array','null']]]]],
			'order' => [ 'oneOf' => [ [ 'type' => 'null'], ['type' => 'number', ] ] ],
			# endregion SchemaProperties;
        ]
    ];
    public function Next(): ? Publication
    {
        $domain = $this->domain;
        $page = $this->page;
        $order = $this->order;
        $pubs = Publications::LoadByFilter(1, 1, '{domain}=[[domain:integer]] and {page}=[[page:integer]] and {order}>[[order:integer]]', '{order} asc', ['domain' => $domain->id, 'page' => $page?->id ?? 0, 'order' => $order]);
        if ($pubs->Count() > 0) {
            return $pubs->First();
        }
        return null;
    }

    public function Previous(): ? Publication
    {
        $domain = $this->domain;
        $page = $this->page;
        $order = $this->order;
        $pubs = Publications::LoadByFilter(1, 1, '{domain}=[[domain:integer]] and {page}=[[page:integer]] and {order}<[[order:integer]]', '{order} desc', ['domain' => $domain->id, 'page' => $page?->id ?? 0, 'order' => $order]);
        if ($pubs->Count() > 0) {
            return $pubs->First();
        }
        return null;
    }

    public function MoveUp(): bool
    {

        $prev = $this->Previous();
        if (!$prev) {
            return false;
        }

        $prevOrder = $prev->order;
        $thisOrder = $this->order;
        $prev->order = $thisOrder;
        $this->order = $prevOrder;

        if (($res = $this->Save(true)) !== true) {
            throw new InvalidArgumentException($res->error, 500);
        }
        if (($res = $prev->Save(true)) !== true) {
            throw new InvalidArgumentException($res->error, 500);
        }

        return true;

    }

    public function MoveDown(): bool
    {

        $next = $this->Next();
        if (!$next) {
            return false;
        }

        $nextOrder = $next->order;
        $thisOrder = $this->order;
        $next->order = $thisOrder;
        $this->order = $nextOrder;

        if (($res = $this->Save(true)) !== true) {
            throw new InvalidArgumentException($res->error, 500);
        }
        if (($res = $next->Save(true)) !== true) {
            throw new InvalidArgumentException($res->error, 500);
        }

        return true;
    }

    public function MoveBefore(? Publication $reference = null): bool
    {
        if (!$reference) {
            $fristPub = Publications::LoadByPage($this->domain, $this->page)->First();
            $this->order = $fristPub ? $fristPub->order / 2 : Publications::StartOrder / 2;
        } else {
            $referencePrev = $reference->Previous();
            $this->order = (($referencePrev ? $referencePrev->order : 0) + $reference->order) / 2;
        }
        if (($res = $this->Save(true)) !== true) {
            throw new InvalidArgumentException($res->error, 500);
        }
        return true;
    }

    public function MoveToStart(): bool
    {
        return $this->MoveBefore(null);
    }

    public function MoveToEnd(): bool
    {

        $pubs = Publications::LoadByFilter(1, 1, '{page}=[[page:string]]', '{order} desc', ['page' => $this->page->id]);
        $lastPub = $pubs->First();
        if (!$lastPub) {
            $this->order = Publications::StartOrder;
        } else {
            $this->order = $lastPub->order + Publications::StartOrder;
        }
        if (($res = $this->Save(true)) !== true) {
            throw new InvalidArgumentException($res->error, 500);
        }
        return true;

    }

    public function DataRow(): mixed
    {
        $storage = Storages::Create()->Load($this->storage);
        [$tableClass, $rowClass] = $storage->GetModelClasses();
        return $tableClass::LoadById($this->row);
    }

    public function Copy(Domain $domain, ? Page $to = null): ? Publication
    {
        $datarow = $this->DataRow();
        if (!$datarow) {
            return null;
        }
        return Publications::CreatePublication($domain, $to, $datarow);
    }

    public function Save(bool $performValidationBeforeSave = false): bool|QueryInfo
    {
        $datarow = $this->DataRow();
        if (!$datarow) {
            // Не получилось
            return false;
        }
        $this->ft = $datarow->ToString();
        $this->object = json_encode($datarow);
        return parent::Save($performValidationBeforeSave);
    }

    public function Out(mixed $args = [], string $templateType = 'item'): string
    {
        $datarow = $this->DataRow();
        $storage = $datarow->Storage();
        $module = $storage->GetModule();
        $templates = $storage->GetTemplates();
        $template = new PhpTemplate($module->modulePath . 'templates/web/' . $templates[$templateType] ?? $templates['default'] ?? Template::Dummy);
        return $template->Render(array_merge($args instanceof ExtendedObject ? $args->GetData() : $args, ['datarow' => $datarow, 'pub' => $this, 'storage' => $storage]));
    }

}