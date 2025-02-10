<?php

namespace App\Modules\Sites\Models;

# region Uses:
use App\Modules\Lang\Models\Fields\Text;
use App\Modules\Sites\Models\Fields\Domains\AdditionalObjectField;
use App\Modules\Sites\Models\Fields\ParametersField;
use Colibri\Data\Storages\Fields\DateTimeField;
use Colibri\Data\Storages\Fields\ObjectField;
# endregion Uses;
use Colibri\Data\Storages\Models\DataRow as BaseModelDataRow;
use Colibri\Data\MySql\QueryInfo;
use Colibri\Common\StringHelper;
use Colibri\App;
use Colibri\Data\NoSqlClient\ICommandResult;

/**
 * Представление строки в таблице в хранилище Сайты
 * @author <author name and email>
 * @package App\Modules\Sites\Models
 * 
 * region Properties:
 * @property int $id ID строки
 * @property DateTimeField $datecreated Дата создания строки
 * @property DateTimeField $datemodified Дата последнего обновления строки
 * @property string $name Ключ домена
 * @property Text $description Описание сайта/домена
 * @property bool $closed Закрыт
 * @property AdditionalObjectField|null $additional Дополнительные параметры
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
			'additional' => [  'oneOf' => [ AdditionalObjectField::JsonSchema, [ 'type' => 'null'] ] ],
			'parameters' => [ 'oneOf' => [ [ 'type' => 'null'], ParametersField::JsonSchema ] ],
			# endregion SchemaProperties;
        ]
    ];

    public function Delete(): QueryInfo|ICommandResult|bool
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
        $meta->{'canonical'} = $this->Url();
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