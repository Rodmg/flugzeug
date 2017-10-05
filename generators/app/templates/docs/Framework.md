# Framework

Este programa utiliza las siguientes tecnologías:

- [Typescript](https://www.typescriptlang.org/docs/tutorial.html)
- [Express](http://expressjs.com/en/4x/api.html)
- [Sequelize](http://docs.sequelizejs.com/en/latest/api/sequelize/)

Se recomienda tener conocimientos básicos de dichas tecnologías antes de trabajar en el proyecto.

## Estructura del proyecto

- **app:** Código del proyecto
- **dist:** Programa compilado para producción
- **docs:** Esta documentación
- **public:** Archivos públicos para ser servidos por el servidor
- **migrations:** Archivos de migración de la base de datos
- **gulpfile.js:** Scripts de compilación, etc.
- **tsconfig.json:** Configuración del compilador typescript
- **package.json:** Configuración del proyecto npm

#### Estructura de app

- **config:** Configuración global de la app
- **controllers:** Controladores de la API HTTP
- **models:** Modelos de DB
- **policies:** Funciones de control de acceso y permisos para ser utilizados en controllers
- **services:** Servicios que corren independientemente de la API o pueden ser utilizados por ésta
- **libraries:** Bibliotecas útiles para el proyecto
- **devices:** Definición de dispositivos
- **db.ts:** Inicialización de la base de datos
- **server.ts:** Inicialización del servidor
- **routes.ts:** Definición de las rutas. Este archivo se encarga por defecto de cargar automáticamente las rutas de la API en ``controllers`` y de servir los archivos públicos de ``../public``
- **main.ts:** Punto de inicio de la aplicación, útil para inicializar los servicios que así lo requieran, en especial los que requieren iniciarse con algún orden específico.
- **declarations.d.ts:** Declaraciones especiales de TypeScript para el proyecto

## API Models

### Archivos de modelos

- Los modelos se definen en la carpeta ``app/models``. 
- El nombre de archivo debe constar del nombre del modelo en singular con la primera letra mayúscula.
- El módulo debe de exportar una definición de modelo de Sequelize.

### Definición de modelos

- El nombre de la tabla del modelo debe de estar en singular y minúsculas.
- La definición del modelos sigue el formato de Sequelize: [documentación](http://docs.sequelizejs.com/en/latest/docs/models-definition/).
- **DIFERENCIA IMPORTANTE:** Las relaciones o asociaciones deben de definirse de una forma especial:

  1. Se define una función en la sección ``classMethods`` de las opciones del modelo de Sequelize llamada ``getAssociations``.
  2. la función getAssociations debe retornar un objeto que contenga objetos que describan las asociaciones.
  3. Las asociaciones deben de tener como llave el nombre de la asociación tal cual como desee que salga en la instancia populada.
  4. los objetos pueden contener cualquiera de las [opciones](http://docs.sequelizejs.com/en/latest/api/associations/) que soportan las funciones de asociación de Sequelize, mas dos extras:
    - type: Tipo de asociación. Puede ser: ``belongsTo``, ``hasOne``, ``hasMany``, ``belongsToMany``.
    - model: Modelo con el cual se asocia.

Los modelos y las asociaciones se cargarán automáticamente al iniciar el servidor, únicamente es necesario hacer import del modelo en donde se requiera utilizar.

Ejemplo:

```js
import * as DataTypes from 'sequelize';
import { db } from './../db';
import { Profile } from './Profile';
import { Auth } from './Auth';

export const User = db.define('user', {
  id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  nickname: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  }
}, {
  classMethods: {
    getAssociations: () => {
      return {
        profile: {
          type: 'belongsTo',
          model: Profile,
          as: 'profile',
          hooks: true
        }
      }
    }
  }
});
```


## API Controllers

### Archivos de controladores

- Los archivos de controladores van en la carpeta ``app/controllers/v1``.
- El nombre de archivo debe constar del nombre del controlador en singular con la primera letra mayúscula.
- El módulo debe exportar una instancia constante del controlador como ``default``.

### Definición del controlador

- El controlador debe ser una clase que extiende de la clase ``Controller``.
- En el constructor se debe definir ``this.name`` (nombre que formará parte de la ruta del controlador).
- En el constructor se debe asignar ``this.model`` al modelo al que se asocie el controlador.
- Se debe redefinir un método ``routes(): Router`` que asigne las rutas a las funciones del controlador, junto con los "policies" necesarios.

* Vea la definición de la clase ``Controller`` para ver ejemplos de cómo definir la función ``routes`` y otras funciones que le pueden ser útiles en sus implementaciones.

Ejemplo:

```js

import { Controller } from './../../libraries/Controller';
import { User } from './../../models/User';

class UserController extends Controller {

  constructor() {
    super();
    this.name = 'user';
    this.model = User;
  }

  routes(): Router {
    // Example routes
    // WARNING: Routes without policies
    // You should add policies before your method
    this.router.get('/', (req, res) => this.find(req, res));
    this.router.get('/:id', (req, res) => this.findOne(req, res));
    this.router.post('/', (req, res) => this.create(req, res));
    this.router.put('/:id', (req, res) => this.update(req, res));
    this.router.delete('/:id', (req, res) => this.destroy(req, res));

    return this.router;
  }

}

const controller = new UserController();
export default controller;
```

### API Rest por defecto de Controladores

- GET ``/api/v2/<nombre>``: Obtiene la lista de todos los items del modelo (JSON Array). El numero total de los objetos se presenta en el header http "Content-Count".
- GET ``/api/v2/<nombre>/<id>``: Obtiene un item del modelo (JSON)
- POST ``/api/v2/<nombre>``: Crea un nuevo item del modelo (Espera JSON en body, devuelve JSON)
- PUT ``/api/v2/<nombre>/<id>``: Modifica un item preexistente del modelo (Espera JSON en body, devuelve JSON)
- DELETE ``api/v2/<nombre>/<id>``: Elimina un item preexistente del modelo (HTTP 204)

#### Query params

- **where**: Acepta un JSON según el formato de query de Sequelize
- **limit**: number, número máximo de resultados a recibir
- **offset** | **skip**: number, numero de offset de los resultados a recibir, útil para paginación.
- **order** | **sort**: string, forma en la cual se van a ordenar los resultados, formato: ``<nombre de columna> <ASC | DESC>``
- **include**: Array[string]: nombres de las columnas de las relaciones a popular, tal como se definieron en `getAsociations` en el Modelo.

**Ejemplo:**

```
GET http://example.com/api/v2/user?where={"name":{"$like":"Alfred"}}&limit=10&offset=20&include=["profile"]&order=lastName ASC
```
