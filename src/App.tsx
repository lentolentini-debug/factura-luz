import React from 'react';

const App = () => {
  console.log('🚀 App básica iniciando...');
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1e293b',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>
        🔧 Caja Facturas - Modo Debug
      </h1>
      
      <div style={{
        backgroundColor: '#334155',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '500px',
        textAlign: 'center'
      }}>
        <p style={{ marginBottom: '10px' }}>
          ✅ React está funcionando
        </p>
        <p style={{ marginBottom: '10px' }}>
          ✅ El componente se está renderizando
        </p>
        <p style={{ marginBottom: '10px' }}>
          🔍 Verificando conexión con Supabase...
        </p>
        
        <button 
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
          onClick={() => {
            console.log('🔘 Botón clickeado');
            alert('La aplicación React está funcionando correctamente!');
          }}
        >
          Probar Interacción
        </button>
      </div>
      
      <div style={{
        marginTop: '20px',
        fontSize: '12px',
        color: '#94a3b8'
      }}>
        Revisa la consola del navegador (F12) para más información
      </div>
    </div>
  );
};

export default App;