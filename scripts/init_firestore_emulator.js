/**
 * Script de inicialización de Firestore Emulator
 * Crea colecciones y datos de ejemplo usando el emulador local
 * 
 * Usa: firebase emulators:start --only firestore
 * Luego: node scripts/init_firestore_emulator.js
 */

const admin = require('firebase-admin');

// Conectar al emulador local
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

admin.initializeApp({
  projectId: 'talentcloud365'
});

const db = admin.firestore();

const PLAN_PRICES_MOVIL = {
  'K1 plus': 12000,
  'K2 plus': 16500,
  'K3 plus': 21500,
  'K4 plus': 29500,
  'K5 plus': 35000,
  'K6 plus': 44000
};

const PLAN_PRICES_HOGAR = {
  'Básico': 10000,
  'Estándar': 15000,
  'Premium': 25000,
  'Profesional': 40000
};

async function initializeDatabase() {
  try {
    console.log('🚀 Inicializando Firestore Emulator...');

    // Crear documento de configuración para planes móvil
    await db.collection('_config').doc('planes_movil').set({
      planes: PLAN_PRICES_MOVIL,
      createdAt: new Date(),
      updatedAt: new Date(),
      description: 'Planes y precios para ventas de móvil'
    });
    console.log('✅ Configuración de planes móvil creada');

    // Crear documento de configuración para planes hogar
    await db.collection('_config').doc('planes_hogar').set({
      planes: PLAN_PRICES_HOGAR,
      createdAt: new Date(),
      updatedAt: new Date(),
      description: 'Planes y precios para ventas de hogar'
    });
    console.log('✅ Configuración de planes hogar creada');

    // Crear documento de estadísticas iniciales
    await db.collection('_stats').doc('general').set({
      totalVentasMobil: 0,
      totalVentasHogar: 0,
      totalRevenue: 0,
      lastUpdate: new Date()
    });
    console.log('✅ Documento de estadísticas creado');

    // Crear colección vacía de ventas (móvil)
    const ventasMobilRef = db.collection('ventas').doc('_placeholder');
    await ventasMobilRef.set({ placeholder: true });
    await ventasMobilRef.delete();
    console.log('✅ Colección "ventas" (móvil) inicializada');

    // Crear colección vacía de ventas hogar
    const ventasHogarRef = db.collection('ventas_hogar').doc('_placeholder');
    await ventasHogarRef.set({ placeholder: true });
    await ventasHogarRef.delete();
    console.log('✅ Colección "ventas_hogar" inicializada');

    // Insertar datos de ejemplo
    console.log('\n📝 Insertando datos de ejemplo...');

    // Ejemplo 1: Venta móvil
    const ventaMobilExample = {
      agenteId: 'agente_demo_1',
      tipoPedido: 'movil',
      numeroPedido: 'KO-53421499',
      plan: 'K2 plus',
      planPrice: 16500,
      imei: '356938035643809',
      accesorioSerie: null,
      cedulaCliente: '123456789',
      numeroCliente: '88881234',
      homeNumber: null,
      customerName: null,
      createdAt: new Date(),
      projections: {
        projection12: 198000,
        monthsRemainingInclusive: 12,
        monthsRemainingExcludingCurrent: 11,
        projectionToYearEnd_inclusive: 198000,
        projectionToYearEnd_excludingCurrent: 181500
      }
    };
    await db.collection('ventas').add(ventaMobilExample);
    console.log('  ✓ Venta móvil de ejemplo agregada');

    // Ejemplo 2: Venta hogar
    const ventaHogarExample = {
      agenteId: 'agente_demo_1',
      tipoPedido: 'hogar',
      numeroPedido: null,
      plan: 'Estándar',
      planPrice: 15000,
      imei: null,
      accesorioSerie: null,
      cedulaCliente: '987654321',
      numeroCliente: null,
      homeNumber: '33620704',
      customerName: 'Juan Pérez',
      createdAt: new Date(),
      projections: {
        projection12: 180000,
        monthsRemainingInclusive: 12,
        monthsRemainingExcludingCurrent: 11,
        projectionToYearEnd_inclusive: 180000,
        projectionToYearEnd_excludingCurrent: 165000
      }
    };
    await db.collection('ventas_hogar').add(ventaHogarExample);
    console.log('  ✓ Venta hogar de ejemplo agregada');

    // Ejemplo 3: Otra venta móvil con accesorioSerie
    const ventaMobil2Example = {
      agenteId: 'agente_demo_2',
      tipoPedido: 'movil',
      numeroPedido: 'KO-53421500',
      plan: 'K4 plus',
      planPrice: 29500,
      imei: '352656089154567',
      accesorioSerie: 'ACC-12345-XYZ',
      cedulaCliente: '555666777',
      numeroCliente: '89991234',
      homeNumber: null,
      customerName: null,
      createdAt: new Date(),
      projections: {
        projection12: 354000,
        monthsRemainingInclusive: 12,
        monthsRemainingExcludingCurrent: 11,
        projectionToYearEnd_inclusive: 354000,
        projectionToYearEnd_excludingCurrent: 324500
      }
    };
    await db.collection('ventas').add(ventaMobil2Example);
    console.log('  ✓ Segunda venta móvil de ejemplo agregada');

    console.log('\n✨ Emulador inicializado exitosamente!');
    console.log('\nEstructura creada:');
    console.log('  📁 Colección: ventas (ventas móvil)');
    console.log('  📁 Colección: ventas_hogar (ventas de hogar)');
    console.log('  📁 Colección: _config (configuración)');
    console.log('  📁 Colección: _stats (estadísticas)');
    console.log('\nÚltimos datos insertados:');
    console.log('  • 2 ventas móvil de ejemplo');
    console.log('  • 1 venta hogar de ejemplo');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la inicialización:', error);
    process.exit(1);
  }
}

initializeDatabase();
