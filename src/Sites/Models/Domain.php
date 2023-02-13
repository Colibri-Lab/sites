<?php

namespace App\Modules\Sites\Models;

# region Uses:
use Colibri\Data\Storages\Fields\DateTimeField;
use App\Modules\Lang\Models\Fields\Text;
use Colibri\Data\Storages\Fields\ObjectField;
use App\Modules\Sites\Models\Fields\ParametersField;
# endregion Uses;
use Colibri\Data\Storages\Models\DataRow as BaseModelDataRow;
use Colibri\Data\MySql\QueryInfo;
use Colibri\Common\StringHelper;
use Colibri\App;

/**
 * Представление строки в таблице в хранилище Сайты
 * @author <author name and email>
 * @package App\Modules\Sites\Models
 * 
 * region Properties:
 * @property-read int $id ID строки
 * @property-read DateTimeField $datecreated Дата создания строки
 * @property-read DateTimeField $datemodified Дата последнего обновления строки
 * @property string $name Ключ домена
 * @property Text $description Описание сайта/домена
 * @property bool $closed Закрыт
 * @property ObjectField|null $additional Дополнительные параметры
 * @property ParametersField|null $parameters 
 * endregion Properties;
 */
class Domain extends BaseModelDataRow
{

    public const JsonSchema = [
        'type' => 'object',
        'required' => [
            'id',
            'datecreated',
            'datemodified',
            # region SchemaRequired:
			'name',
			'description',
			'closed',
			# endregion SchemaRequired;
        ],
        'properties' => [
            'id' => ['type' => 'integer'],
            'datecreated' => ['type' => 'string', 'format' => 'db-date-time'],
            'datemodified' => ['type' => 'string', 'format' => 'db-date-time'],
            # region SchemaProperties:
			'name' => ['type' => 'string', 'maxLength' => 255, ],
			'description' => Text::JsonSchema,
			'closed' => ['type' => ['boolean','number'], 'enum' => [true, false, 0, 1],],
			'additional' => ['type' => 'object', 'required' => [], 'properties' => ['meta' => ['type' => 'object', 'required' => [], 'properties' => ['title' => [ 'oneOf' => [ [ 'type' => 'null'], Text::JsonSchema ] ],'description' => [ 'oneOf' => [ [ 'type' => 'null'], Text::JsonSchema ] ],'keywords' => [ 'oneOf' => [ [ 'type' => 'null'], Text::JsonSchema ] ],]],'settings' => ['type' => 'object', 'required' => ['type','module',], 'properties' => ['type' => ['type' => 'string', 'enum' => ['application', 'website']],'module' => ['type' => 'string', 'maxLength' => 255, ],'component' => [ 'oneOf' => [ [ 'type' => 'null'], ['type' => 'string', 'maxLength' => 255, ] ] ],'template' => [ 'oneOf' => [ [ 'type' => 'null'], ['type' => 'string', 'maxLength' => 255, ] ] ],]],'parameters' => ['type' => 'array', 'items' => ['type' => 'object', 'required' => [], 'properties' => ['name' => [ 'oneOf' => [ [ 'type' => 'null'], ['type' => 'string', 'maxLength' => 50, ] ] ],'description' => [ 'oneOf' => [ [ 'type' => 'null'], Text::JsonSchema ] ],'type' => [ 'oneOf' => [ [ 'type' => 'null'], ['type' => 'string', 'maxLength' => 20, ] ] ],'length' => [ 'oneOf' => [ [ 'type' => 'null'], ['type' => 'integer', ] ] ],'default' => [ 'oneOf' => [ [ 'type' => 'null'], ['type' => 'string', 'maxLength' => 255, ] ] ],'class' => [ 'oneOf' => [ [ 'type' => 'null'], ['type' => 'string', 'maxLength' => 255, ] ] ],'component' => [ 'oneOf' => [ [ 'type' => 'null'], ['type' => 'string', 'maxLength' => 255, ] ] ],]]],]],
			'parameters' => [ 'oneOf' => [ [ 'type' => 'null'], ParametersField::JsonSchema ] ],
			# endregion SchemaProperties;
        ]
    ];

    public function Delete(): QueryInfo
    {
        Pages::DeleteAllByDomain($this);
        return parent::Delete();
    }

    public function Template(): ?string
    {
        return $this->additional?->settings?->template;
    }

    public function Component(): ?string
    {
        return $this->additional?->settings?->component;
    }

    public function GetMeta(): object
    {
        $meta = $this->additional->meta;
        $meta->canonical = $this->Url();
        return $meta;
    }

    public function Url(array $params = []): string
    {
        $uri = StringHelper::AddToQueryString('/', $params, true);
        return App::$router->Uri($uri);
    }

    public function Publications(int $page = -1, $pagesize = 20, string $term = ''): Publications
    {
        return Publications::LoadByPage($this, 0, $term, $page, $pagesize);
    }

}