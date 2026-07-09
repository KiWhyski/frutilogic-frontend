/**
 * Script de Prueba - Verificar API de Clasificación
 *
 * Ejecuta este archivo desde la consola para verificar que la API está funcionando correctamente
 *
 * Pasos:
 * 1. Abre la página con el módulo de reconocimiento de imágenes
 * 2. Abre la consola del navegador (F12)
 * 3. Copia todo el contenido de este archivo a la consola
 * 4. Presiona Enter
 */

// Test 1: Verificar salud de la API
console.log('🔍 Test 1: Verificando salud de la API...');
async function testHealthCheck() {
  try {
    const response = await fetch('http://localhost:5000/api/v1/health');
    if (response.ok) {
      console.log('✅ API está operativa y disponible');
      return true;
    } else {
      console.error('❌ API respondió con error:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error conexión a API:', error.message);
    return false;
  }
}

// Test 2: Probar clasificación con imagen de prueba
console.log('\n🔍 Test 2: Probando clasificación...');
async function testClassification() {
  try {
    // Crear una imagen de prueba simple (canvas blanco)
    const canvas = document.createElement('canvas');
    canvas.width = 224;
    canvas.height = 224;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 224, 224);

    // Convertir canvas a blob
    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('file', blob, 'test.jpg');

      try {
        const response = await fetch('http://localhost:5000/api/v1/classify', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Clasificación exitosa');
          console.log('📊 Resultado:', data);
        } else {
          console.error('❌ Error en clasificación:', response.status);
          const error = await response.json();
          console.error('📋 Detalles:', error);
        }
      } catch (error) {
        console.error('❌ Error enviando clasificación:', error.message);
      }
    }, 'image/jpeg');
  } catch (error) {
    console.error('❌ Error en test de clasificación:', error);
  }
}

// Test 3: Importar y probar el servicio
console.log('\n🔍 Test 3: Probando servicio imageClassificationService...');
async function testService() {
  try {
    // Este test asume que estamos en la página con el componente cargado
    if (typeof imageClassificationService === 'undefined') {
      console.warn('⚠️  Servicio no disponible en este contexto');
      console.info('💡 El servicio solo está disponible dentro del componente Vue');
      return;
    }

    const isHealthy = await imageClassificationService.checkHealth();
    if (isHealthy) {
      console.log('✅ Servicio está conectado a API saludable');
    } else {
      console.error('❌ Servicio reporta API no saludable');
    }
  } catch (error) {
    console.error('❌ Error probando servicio:', error);
  }
}

// Ejecutar tests
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 INICIANDO PRUEBAS DE API DE CLASIFICACIÓN');
  console.log('═══════════════════════════════════════════════════════\n');

  const healthOk = await testHealthCheck();

  if (healthOk) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testClassification();
  } else {
    console.warn('\n⚠️  Saltando prueba de clasificación (API no disponible)');
  }

  await new Promise(resolve => setTimeout(resolve, 1000));
  await testService();

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✨ Pruebas completadas');
  console.log('═══════════════════════════════════════════════════════\n');

  if (healthOk) {
    console.log('📝 RESULTADO: API está disponible y funcionando ✅');
  } else {
    console.log('📝 RESULTADO: API NO está disponible ❌');
    console.log('\n🔧 Solución: Asegúrate de que:');
    console.log('   1. El servidor API está ejecutándose en localhost:5000');
    console.log('   2. La ruta http://localhost:5000/api/v1/health es accesible');
    console.log('   3. No hay bloqueos de CORS (verifica consola del navegador)');
  }
}

// Ejecutar
runAllTests();

