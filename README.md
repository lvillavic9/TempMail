# TempMail Pro - Correos Temporales

Una aplicación web moderna y funcional para generar correos electrónicos temporales utilizando la API de TestMail.app.

![TempMail Pro](https://via.placeholder.com/800x400/667eea/ffffff?text=TempMail+Pro)

## 🚀 Características

- **Generación de emails temporales** con alias personalizado
- **Interfaz moderna y responsive** inspirada en EduMail, Temp Mail y GuerrillaMail
- **Actualización automática** de la bandeja de entrada
- **Visualización en tiempo real** de correos recibidos
- **Copia al portapapeles** con un solo clic
- **Modal para lectura completa** de emails con soporte HTML
- **Temporizador configurable** (5s, 10s, 30s, 1min)
- **Validación robusta** de entrada de usuario
- **Persistencia local** del estado de la aplicación
- **Notificaciones toast** para feedback del usuario

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **API**: TestMail.app JSON API
- **Estilo**: CSS Grid, Flexbox, Variables CSS
- **Iconos**: Font Awesome 6
- **Fuentes**: Google Fonts (Inter)
- **Hosting**: Compatible con GitHub Pages

## 📋 Requisitos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexión a internet para la API de TestMail
- No requiere instalación de dependencias

## 🚀 Instalación y Configuración

### Opción 1: GitHub Pages (Recomendado)

1. **Fork este repositorio** o créalo nuevo con estos archivos
2. **Habilita GitHub Pages** en la configuración del repositorio
3. **Accede a tu sitio** en `https://tu-usuario.github.io/nombre-repositorio`

### Opción 2: Servidor Local

1. **Clona el repositorio**:
   ```bash
   git clone https://github.com/tu-usuario/tempmail-pro.git
   cd tempmail-pro
   ```

2. **Sirve los archivos** usando cualquier servidor HTTP:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   
   # Node.js (usando npx)
   npx serve .
   
   # PHP
   php -S localhost:8000
   ```

3. **Abre tu navegador** en `http://localhost:8000`

## 📖 Manual de Usuario

### Generar un Email Temporal

1. **Ingresa un alias** en el campo de texto (ej: "mi-alias")
   - Solo letras, números, puntos, guiones y guiones bajos
   - Máximo 30 caracteres
   - No puede empezar o terminar con punto

2. **Haz clic en "Generar"** o presiona Enter

3. **Tu email temporal** se generará en el formato:
   ```
   wjlcs.tu-alias@inbox.testmail.app
   ```

### Gestionar Correos

- **Copiar email**: Usa el botón de copiar junto al email generado
- **Ver correos**: Los emails aparecen automáticamente en la bandeja
- **Leer email completo**: Haz clic en cualquier email para abrir el modal
- **Actualizar manualmente**: Usa el botón "Actualizar"
- **Cambiar frecuencia**: Selecciona el intervalo de actualización automática
- **Limpiar bandeja**: Usa "Limpiar Todo" para eliminar todos los correos

### Características Avanzadas

- **Persistencia**: La aplicación recuerda tu último email por 24 horas
- **Responsive**: Funciona perfectamente en móviles y tablets
- **Notificaciones**: Recibe feedback visual de todas las acciones
- **Seguridad**: Validación de entrada y escape de HTML

## 🔧 Configuración Técnica

### Variables de la API

```javascript
const API_CONFIG = {
    API_KEY: 'e769cbfe-db59-4af7-97d3-74703239d385',
    NAMESPACE: 'wjlcs',
    BASE_URL: 'https://api.testmail.app/api/json'
};
```

### Formato del Email

```
{namespace}.{tag}@inbox.testmail.app
```

Donde:
- `namespace` = "wjlcs" (fijo)
- `tag` = alias ingresado por el usuario

### Endpoints Utilizados

1. **Obtener emails**:
   ```
   GET /api/json?apikey={key}&namespace={ns}&tag={tag}&livequery=true
   ```

2. **Eliminar emails**:
   ```
   GET /api/json?apikey={key}&namespace={ns}&tag={tag}&action=delete
   ```

## 🎨 Personalización

### Cambiar Colores

Modifica las variables CSS en `styles.css`:

```css
:root {
    --primary-color: #667eea;     /* Color principal */
    --secondary-color: #764ba2;   /* Color secundario */
    --success-color: #10b981;     /* Color de éxito */
    --danger-color: #ef4444;      /* Color de error */
}
```

### Modificar Intervalos

Cambia los intervalos de actualización en `script.js`:

```javascript
// En el HTML del select de intervalos
<option value="3000">3 segundos</option>
<option value="5000">5 segundos</option>
// ... más opciones
```

## 🔒 Seguridad

- **Validación de entrada**: Previene inyección de código malicioso
- **Escape HTML**: Todo el contenido se escapa antes de mostrarse
- **API Key**: Se usa la clave proporcionada para TestMail
- **HTTPS**: La aplicación funciona sobre conexiones seguras
- **Sin almacenamiento sensible**: No se guardan passwords ni datos críticos

## 🐛 Resolución de Problemas

### Error de CORS
Si experimentas errores de CORS, asegúrate de:
- Servir la aplicación desde un servidor HTTP (no file://)
- Usar HTTPS si es posible

### API No Responde
- Verifica tu conexión a internet
- Confirma que la API Key sea correcta
- Revisa la consola del navegador para errores

### Emails No Aparecen
- Espera unos segundos para que lleguen
- Usa el botón "Actualizar" manualmente
- Verifica que el alias sea válido

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -am 'Añade nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Crea un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Desarrollador

**@lvillavic9**
- GitHub: [lvillavic9](https://github.com/lvillavic9)

## 📞 Soporte

Si tienes problemas o preguntas:
1. Revisa la sección de [Issues](https://github.com/tu-usuario/tempmail-pro/issues)
2. Crea un nuevo issue con detalles del problema
3. Incluye información del navegador y pasos para reproducir

## 🙏 Agradecimientos

- [TestMail.app](https://testmail.app) por proporcionar la API
- [Font Awesome](https://fontawesome.com) por los iconos
- [Google Fonts](https://fonts.google.com) por la tipografía Inter
- Inspiración de diseño: EduMail, Temp Mail, GuerrillaMail

---

**¿Te gusta el proyecto? ¡Dale una ⭐ en GitHub!**