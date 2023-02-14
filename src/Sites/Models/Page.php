<?php

namespace App\Modules\Sites\Models;

# region Uses:
use App\Modules\Lang\Models\Fields\Text;
use App\Modules\Sites\Models\Domain;
use App\Modules\Sites\Models\Fields\Pages\AdditionalObjectField;
use App\Modules\Sites\Models\Fields\ParametersField;
use Colibri\Data\Storages\Fields\DateTimeField;
use Colibri\Data\Storages\Fields\ObjectField;
# endregion Uses;
use Colibri\Data\Storages\Models\DataRow as BaseModelDataRow;
use Colibri\Data\SqlClient\QueryInfo;
use Colibri\Common\StringHelper;
use Colibri\App;

/**
 * Представление строки в таблице в хранилище Публикации
 * @author <author name and email>
 * @package App\Modules\Sites\Models
 * 
 * region Properties:
 * @property int $id ID строки
 * @property DateTimeField $datecreated Дата создания строки
 * @property DateTimeField $datemodified Дата последнего обновления строки
 * @property Domain $domain Домен
 * @property Page|null $parent Отцовская страница
 * @property string $name Наименование раздела
 * @property Text $description Описание страницы
 * @property bool $published Опубликована
 * @property AdditionalObjectField|null $additional Всякое
 * @property ParametersField|null $parameters Параметры
 * @property float|null $order Позиция в рамках parent-а
 * endregion Properties;
 * @property-read string $path полный путь от домена
 */
class Page extends BaseModelDataRow
{

    public const JsonSchema = [
        'type' => 'object',
        'required' => [
            'id',
            'datecreated',
            'datemodified',
            # region SchemaRequired:
			'domain',
			'name',
			'description',
			'published',
			# endregion SchemaRequired;
        ],
        'properties' => [
            'id' => ['type' => 'integer'],
            'datecreated' => ['type' => 'string', 'format' => 'db-date-time'],
            'datemodified' => ['type' => 'string', 'format' => 'db-date-time'],
            # region SchemaProperties:
			'domain' => Domain::JsonSchema,
			'parent' => [ 'oneOf' => [ [ 'type' => 'null' ], ['$ref' => '#'] ] ], 
			'name' => ['type' => 'string', 'maxLength' => 255, ],
			'description' => Text::JsonSchema,
			'published' => ['type' => ['boolean','number'], 'enum' => [true, false, 0, 1],],
			'additional' => [  'oneOf' => [ AdditionalObjectField::JsonSchema, [ 'type' => 'null'] ] ],
			'parameters' => [ 'oneOf' => [ [ 'type' => 'null'], ParametersField::JsonSchema ] ],
			'order' => [ 'oneOf' => [ [ 'type' => 'null'], ['type' => 'number', ] ] ],
			# endregion SchemaProperties;
        ]
    ];

    public function Publications(int $page = -1, $pagesize = 20, string $term = ''): Publications
    {
        return Publications::LoadByPage($this->domain, $this, $term, $page, $pagesize);
    }

    public function Children(int $page = -1, int $pagesize = 20): Pages
    {
        return Pages::LoadByParent($this->domain, $this, $page, $pagesize);
    }

    public function Next(): ? Page
    {
        $parent = $this->parent;
        $order = $this->order;
        $pages = Pages::LoadByFilter(1, 1, '{parent}=[[parent:integer]] and {order}>[[order:integer]]', '{order} asc', ['parent' => $parent ? $parent->id : 0, 'order' => $order]);
        if ($pages->Count() > 0) {
            return $pages->First();
        }
        return null;
    }

    public function Previous(): ? Page
    {
        $parent = $this->parent;
        $order = $this->order;
        $pages = Pages::LoadByFilter(1, 1, '{parent}=[[parent:integer]] and {order}<[[order:integer]]', '{order} desc', ['parent' => $parent ? $parent->id : 0, 'order' => $order]);
        if ($pages->Count() > 0) {
            return $pages->First();
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

        $this->Save();
        $prev->Save();

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

        $this->Save();
        $next->Save();

        return true;
    }

    public function MoveBefore(? Page $reference = null): bool
    {
        if (!$reference) {
            $fristPub = Pages::LoadByParent($this->parent ?: 0, 1, 1)->First();
            $this->order = $fristPub ? $fristPub->order / 2 : Pages::StartOrder / 2;
        } else {
            $referencePrev = $reference->Previous();
            $this->order = (($referencePrev ? $referencePrev->order : 0) + $reference->order) / 2;
        }
        $this->Save();
        return true;
    }

    public function MoveAfter(? Page $reference = null): bool
    {
        if (!$reference) {
            $lastPub = Pages::LoadByParentReverce($this->parent ?: 0, 1, 1)->First();
            $this->order = $lastPub ? $lastPub->order + Pages::StartOrder : Pages::StartOrder;
        } else {
            $referenceNext = $reference->Next();
            $this->order = (($referenceNext ? $referenceNext->order : 0) + $reference->order) / 2;
        }
        $this->Save();
        return true;
    }

    public function MoveToStart(): bool
    {
        return $this->MoveBefore(null);
    }

    public function MoveToEnd(): bool
    {

        $pubs = Pages::LoadByFilter(1, 1, '{parent}=[[parent:string]]', '{order} desc', ['parent' => $this->parent?->id ?: 0]);
        $lastPage = $pubs->First();
        if (!$lastPage) {
            $this->order = Publications::StartOrder;
        } else {
            $this->order = $lastPage->order + Publications::StartOrder;
        }
        $this->Save();
        return true;

    }

    private function _moveBranch()
    {
        $children = $this->Children();
        foreach ($children as $child) {
            $child->MoveTo($this, false);
        }
    }

    public function MoveTo(Page|Domain $page, bool $moveToEnd = true): bool
    {
        if ($page instanceof Domain) {
            $this->parent = 0;
            $this->domain = $page;
        } else {
            $this->domain = $page->domain;
            $this->parent = $page;
        }
        $this->_moveBranch();
        $this->Save();
        return $moveToEnd ? $this->MoveToEnd() : true;
    }

    public function Delete(): QueryInfo
    {

        // удаляем все публикации
        Publications::DeleteAllByPage($this);

        $childs = $this->Children();
        foreach ($childs as $child) {
            $child->Delete();
        }

        return parent::Delete();

    }

    public function Path(): array
    {

        if (!$this->parent) {
            return [$this];
        }

        $ret = [$this];
        $parent = $this->parent;
        while ($parent) {
            $ret[] = $parent;
            $parent = $parent->parent;
        }
        $ret = array_reverse($ret);

        return $ret;

    }

    public function Url(array $params = []): string
    {
        $url = [];
        $path = $this->Path();
        foreach ($path as $page) {
            $url[] = $page->name;
        }
        $uri = StringHelper::AddToQueryString('/' . implode('/', $url) . '/', $params, true);
        return App::$router->Uri($uri);
    }

    public function Template(): ?string
    {
        $template = $this->additional?->settings?->template;
        if ($template) {
            return $template;
        }

        $parent = $this->parent;
        while ($parent) {
            /** @var Page $parent */
            $template = $parent->additional->settings->template;
            if ($template) {
                break;
            }
            $parent = $parent->parent;
        }

        if ($template) {
            return $template;
        }

        return $this->domain->additional?->settings?->template;

    }

    public function Component(): ?string
    {
        $component = $this->additional?->settings?->component;
        if ($component) {
            return $component;
        }

        $parent = $this->parent;
        while ($parent) {
            /** @var Page $parent */
            $component = $parent->additional->settings->component;
            if ($component) {
                break;
            }
            $parent = $parent->parent;
        }

        if ($component) {
            return $component;
        }

        return $this->domain->additional?->settings?->component;

    }

    public function getPropertyPath(): string
    {
        $ret = [];
        $path = $this->Path();
        foreach ($path as $p) {
            $ret[] = $p->name;
        }
        return implode('/', $ret);
    }

    public function IsChildOf(Page $page): bool
    {
        return strpos($this->path . '/', $page->path . '/') === 0;
    }

    public function GetMeta(): object
    {
        $meta = $this->additional->meta;
        $meta->canonical = $this->Url();
        return $meta;
    }


}