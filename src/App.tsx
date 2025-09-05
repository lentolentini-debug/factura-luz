import React from 'react';

console.log('🚀 Iniciando App muy simple...');

const App = () => {
  console.log('📱 Renderizando componente App...');
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a, #7c3aed)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        color: '#1f2937',
        padding: '40px',
        borderRadius: '16px',
        textAlign: 'center',
        maxWidth: '500px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: '24px',
          color: 'white'
        }}>
          📋
        </div>
        
        <h1 style={{ 
          fontSize: '32px', 
          marginBottom: '10px',
          color: '#1f2937'
        }}>
          Caja Facturas
        </h1>
        
        <p style={{ 
          color: '#6b7280', 
          marginBottom: '30px' 
        }}>
          Sistema de Gestión de Cobros
        </p>
        
        <div style={{
          background: '#f3f4f6',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#059669', marginBottom: '10px' }}>
            ✅ Aplicación React Funcionando
          </h3>
          <p style={{ fontSize: '14px', color: '#374151' }}>
            La aplicación se está ejecutando correctamente
          </p>
        </div>
        
        <div style={{
          display: 'grid',
          gap: '15px',
          marginBottom: '20px'
        }}>
          <div style={{
            background: '#dbeafe',
            padding: '15px',
            borderRadius: '8px',
            borderLeft: '4px solid #3b82f6'
          }}>
            <h4 style={{ color: '#1e40af', margin: '0 0 5px 0' }}>📄 Facturas</h4>
            <p style={{ fontSize: '14px', color: '#1e40af', margin: '0' }}>
              Gestión de facturas y cobros
            </p>
          </div>
          
          <div style={{
            background: '#d1fae5',
            padding: '15px',
            borderRadius: '8px',
            borderLeft: '4px solid #10b981'
          }}>
            <h4 style={{ color: '#065f46', margin: '0 0 5px 0' }}>💰 Pagos</h4>
            <p style={{ fontSize: '14px', color: '#065f46', margin: '0' }}>
              Registro de pagos recibidos
            </p>
          </div>
          
          <div style={{
            background: '#ede9fe',
            padding: '15px',
            borderRadius: '8px',
            borderLeft: '4px solid #8b5cf6'
          }}>
            <h4 style={{ color: '#5b21b6', margin: '0 0 5px 0' }}>🏢 Proveedores</h4>
            <p style={{ fontSize: '14px', color: '#5b21b6', margin: '0' }}>
              Administración de proveedores
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => {
            alert('¡La aplicación está funcionando perfectamente! 🎉\n\nPróximos pasos:\n1. Agregar autenticación\n2. Conectar con Supabase\n3. Implementar funcionalidades');
          }}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Probar Aplicación
        </button>
        
        <div style={{
          marginTop: '20px',
          fontSize: '12px',
          color: '#9ca3af'
        }}>
          Versión simplificada - React + TypeScript + Vite
        </div>
      </div>
    </div>
  );
};

export default App;