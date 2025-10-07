import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Send, Check, Loader2, AlertCircle, CheckCircle, RefreshCw, Building2, LogOut } from 'lucide-react';

// URL del backend en producción
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const TusFacturasApp = () => {
  // 🔐 Estados de autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 📊 Estados de la app
  const [templates, setTemplates] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClient, setNewClient] = useState({ nombre: '', email: '', documento: '' });
  const [editingField, setEditingField] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('checking');

  // Verificar si hay sesión guardada al cargar
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('tusfacturas_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      testConnection();
    } else {
      setLoading(false);
    }
  }, []);

  // 🔐 Función de login
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    await new Promise(resolve => setTimeout(resolve, 500));

    const validUsername = 'Monica';
    const validPassword = 'Nacho2025!';

    if (loginForm.username === validUsername && loginForm.password === validPassword) {
      sessionStorage.setItem('tusfacturas_auth', 'true');
      setIsAuthenticated(true);
      testConnection();
    } else {
      setLoginError('Usuario o contraseña incorrectos');
    }

    setIsLoggingIn(false);
  };

  // 🚪 Función de logout
  const handleLogout = () => {
    sessionStorage.removeItem('tusfacturas_auth');
    setIsAuthenticated(false);
    setTemplates([]);
    setClientes([]);
    setLoginForm({ username: '', password: '' });
  };

  // 🔌 Test de conexión inicial
  const testConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/test`);
      if (response.ok) {
        setConnectionStatus('connected');
        cargarDatos();
      } else {
        setConnectionStatus('error');
        setError('No se pudo conectar con TusFacturas');
      }
    } catch (err) {
      setConnectionStatus('error');
      setError('Error de conexión con el servidor');
      cargarDatosEjemplo();
    }
  };

  // 📥 Cargar datos desde TusFacturas
  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Cargando datos desde TusFacturas...');
      
      const [clientesRes, templatesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/clientes`),
        fetch(`${API_BASE_URL}/api/templates`)
      ]);
      
      const clientesData = await clientesRes.json();
      const templatesData = await templatesRes.json();
      
      console.log('✅ Datos cargados:', { clientes: clientesData.length, templates: templatesData.length });
      
      setClientes(clientesData);
      setTemplates(templatesData);
      setLastSync(new Date());
      
    } catch (err) {
      console.error('❌ Error cargando datos:', err);
      setError('Error al cargar datos de TusFacturas');
      cargarDatosEjemplo();
    } finally {
      setLoading(false);
    }
  };

  // 📝 Cargar datos de ejemplo (fallback)
  const cargarDatosEjemplo = () => {
    console.log('📝 Cargando datos de ejemplo...');
    
    const clientesEjemplo = [
      { id: 1, nombre: 'Empresa ABC S.A.', email: 'facturacion@empresa-abc.com', documento: '30123456789' },
      { id: 2, nombre: 'Comercial XYZ Ltda.', email: 'admin@comercial-xyz.com', documento: '20987654321' },
      { id: 3, nombre: 'Distribuidora Norte', email: 'ventas@distri-norte.com', documento: '27456789123' },
      { id: 4, nombre: 'Supermercado Central', email: 'contabilidad@super-central.com', documento: '30789123456' }
    ];
    
    const templatesEjemplo = [
      { id: 1, clienteId: 1, concepto: 'Honorarios Profesionales - {MM_AAAA_ANTERIOR_TEXTO}', monto: 150000, selected: true },
      { id: 2, clienteId: 2, concepto: 'Servicios de consultoría - {MM_AAAA_ANTERIOR_TEXTO}', monto: 85000, selected: true },
      { id: 3, clienteId: 3, concepto: 'Asesoramiento técnico - {MM_AAAA_ANTERIOR_TEXTO}', monto: 120000, selected: true },
      { id: 4, clienteId: 4, concepto: 'Auditoría mensual - {MM_AAAA_ANTERIOR_TEXTO}', monto: 95000, selected: true }
    ];
    
    setClientes(clientesEjemplo);
    setTemplates(templatesEjemplo);
    setLastSync(new Date());
    setLoading(false);
  };

  // 💾 Guardar templates automáticamente
  const guardarTemplates = async (templatesActualizados) => {
    try {
      await fetch(`${API_BASE_URL}/api/templates/guardar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templates: templatesActualizados
        })
      });
      console.log('💾 Templates guardados automáticamente');
    } catch (err) {
      console.error('Error guardando templates:', err);
    }
  };

  // 💾 Guardar clientes automáticamente
  const guardarClientes = async (clientesActualizados) => {
    try {
      await fetch(`${API_BASE_URL}/api/clientes/guardar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientes: clientesActualizados
        })
      });
      console.log('💾 Clientes guardados automáticamente');
    } catch (err) {
      console.error('Error guardando clientes:', err);
    }
  };

  // ✏️ Editar template
  const handleEdit = (id, field, value) => {
    const updatedTemplates = templates.map(t => 
      t.id === id ? { ...t, [field]: field === 'clienteId' ? parseInt(value) : value } : t
    );
    setTemplates(updatedTemplates);
    setEditingField(null);
    guardarTemplates(updatedTemplates);
  };

  // 🔍 Obtener nombre del cliente
  const getClienteName = (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente ? cliente.nombre : 'Cliente no encontrado';
  };

  // ☑️ Toggle selección
  const toggleSelection = (id) => {
    setTemplates(templates.map(t => 
      t.id === id ? { ...t, selected: !t.selected } : t
    ));
  };

  // 🗑️ Eliminar template
  const deleteTemplate = (id) => {
    const updatedTemplates = templates.filter(t => t.id !== id);
    setTemplates(updatedTemplates);
    guardarTemplates(updatedTemplates);
  };

  // ➕ Agregar template
  const addTemplate = () => {
    const newId = Math.max(...templates.map(t => t.id), 0) + 1;
    const newTemplate = {
      id: newId,
      clienteId: clientes.length > 0 ? clientes[0].id : 1,
      concepto: 'Honorarios Profesionales - {MM_AAAA_ACTUAL_TEXTO}',
      monto: 0,
      selected: true
    };
    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    guardarTemplates(updatedTemplates);
  };

  const selectedCount = templates.filter(t => t.selected).length;
  const totalAmount = templates.filter(t => t.selected).reduce((sum, t) => sum + t.monto, 0);

  const handleSendAll = () => {
    if (selectedCount === 0) return;
    setShowConfirmation(true);
  };

  // 📤 Confirmar y enviar facturas
  const confirmSend = async () => {
    setShowConfirmation(false);
    setSending(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('🚀 Enviando facturas seleccionadas...');
      
      const response = await fetch(`${API_BASE_URL}/api/enviar-facturas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templates: templates.filter(t => t.selected)
        })
      });
      
      if (!response.ok) throw new Error('Error al enviar facturas');
      
      const result = await response.json();
      
      console.log('✅ Resultado del envío:', result);
      
      setSuccess({
        total: result.total,
        exitosas: result.exitosas,
        fallidas: result.fallidas,
        detalles: result.detalles,
        modoPrueba: result.modo_prueba || false
      });
      
      if (result.fallidas === 0) {
        const updatedTemplates = templates.map(t => ({ ...t, selected: false }));
        setTemplates(updatedTemplates);
        guardarTemplates(updatedTemplates);
      }
      
    } catch (err) {
      console.error('❌ Error enviando facturas:', err);
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  // 🔐 PANTALLA DE LOGIN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
              <Building2 className="w-12 h-12 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Facturas Automáticas</h1>
            <p className="text-gray-600">SILVIA MONICA NAHABETIAN</p>
            <p className="text-sm text-gray-500">CUIT: 27233141246</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario
              </label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ingresá tu usuario"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ingresá tu contraseña"
                required
              />
            </div>

            {loginError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-red-800 text-sm">{loginError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            Sistema de facturación automática
          </div>
        </div>
      </div>
    );
  }

  // ⏳ PANTALLA DE CARGA
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Conectando con TusFacturas...</p>
          <p className="text-sm text-gray-500 mt-2">SILVIA MONICA NAHABETIAN - CUIT: 27233141246</p>
        </div>
      </div>
    );
  }

  // 🏠 PANTALLA PRINCIPAL
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  Facturas Automáticas
                  <button 
                    onClick={cargarDatos}
                    disabled={loading}
                    className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-50"
                    title="Sincronizar con TusFacturas"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </h1>
                <div className="text-gray-600 text-sm space-y-1">
                  <p className="font-medium">SILVIA MONICA NAHABETIAN</p>
                  <p>CUIT: 27233141246 • PDV: 00006 • {templates.length} templates</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      connectionStatus === 'connected' ? 'bg-green-500' : 
                      connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <span className="text-xs">
                      {connectionStatus === 'connected' ? 'Conectado con ARCA' : 
                       connectionStatus === 'error' ? 'Modo offline' : 'Conectando...'}
                    </span>
                    {lastSync && (
                      <span className="text-xs text-gray-400">
                        • Sync: {lastSync.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={addTemplate}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agregar Template
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mensajes de estado */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium">Error de conexión</p>
                <p className="text-red-600 text-sm">{error}</p>
                {connectionStatus === 'error' && (
                  <p className="text-red-500 text-xs mt-1">
                    Mostrando datos de ejemplo. Verificá tu conexión a internet.
                  </p>
                )}
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                <CheckCircle className="w-5 h-5" />
                {success.modoPrueba ? '🧪 Simulación completada (MODO PRUEBA)' : '¡Facturas enviadas exitosamente!'}
              </div>
              <div className="text-green-600 text-sm space-y-1">
                <p>✅ {success.exitosas} de {success.total} facturas procesadas correctamente</p>
                {success.fallidas > 0 && (
                  <p className="text-red-600">❌ {success.fallidas} facturas fallaron</p>
                )}
                {success.modoPrueba ? (
                  <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded">
                    <p className="text-yellow-800 text-xs font-bold">⚠️ MODO PRUEBA ACTIVO</p>
                    <p className="text-yellow-700 text-xs">
                      Esta fue una simulación. NO se enviaron facturas reales a ARCA.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-green-500 mt-2">
                    Las facturas están siendo procesadas por ARCA. Podés verificar el estado en tu panel de TusFacturas.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Lista de templates */}
          {templates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No hay facturas del mes anterior</p>
              <p className="text-sm">Agregá templates manualmente o esperá al próximo mes</p>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
                <div key={template.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={template.selected}
                    onChange={() => toggleSelection(template.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  
                  <div className="flex-1 grid grid-cols-3 gap-4">
                    {/* Cliente */}
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Cliente</label>
                      {editingField === `cliente-${template.id}` ? (
                        <select
                          value={template.clienteId}
                          onChange={(e) => handleEdit(template.id, 'clienteId', e.target.value)}
                          onBlur={() => setEditingField(null)}
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          autoFocus
                        >
                          {clientes.map(cliente => (
                            <option key={cliente.id} value={cliente.id}>
                              {cliente.nombre}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div
                          onClick={() => setEditingField(`cliente-${template.id}`)}
                          className="p-2 cursor-pointer hover:bg-white rounded font-medium text-sm"
                        >
                          {getClienteName(template.clienteId)}
                        </div>
                      )}
                    </div>

                    {/* Concepto */}
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Concepto</label>
                      {editingField === `concepto-${template.id}` ? (
                        <input
                          type="text"
                          value={template.concepto}
                          onChange={(e) => handleEdit(template.id, 'concepto', e.target.value)}
                          onBlur={() => setEditingField(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() => setEditingField(`concepto-${template.id}`)}
                          className="p-2 cursor-pointer hover:bg-white rounded text-sm"
                        >
                          {template.concepto}
                        </div>
                      )}
                    </div>

                    {/* Monto */}
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Monto</label>
                      {editingField === `monto-${template.id}` ? (
                        <input
                          type="number"
                          step="0.01"
                          value={template.monto}
                          onChange={(e) => handleEdit(template.id, 'monto', parseFloat(e.target.value) || 0)}
                          onBlur={() => setEditingField(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() => setEditingField(`monto-${template.id}`)}
                          className="p-2 cursor-pointer hover:bg-white rounded font-mono text-sm"
                        >
                          ${template.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteTemplate(template.id)}
                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors"
                    title="Eliminar template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Panel de envío */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">
                    {selectedCount} facturas seleccionadas
                  </span>
                </div>
                <div className="text-blue-700">
                  Total: <span className="font-bold font-mono">
                    ${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              
              <button
                onClick={handleSendAll}
                disabled={selectedCount === 0 || sending}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {sending ? 'Enviando...' : `Enviar ${selectedCount} Facturas`}
              </button>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <p>💡 <strong>Tip:</strong> Hacé click en cualquier campo para editarlo</p>
            <p>🏷️ Los tags como {'{MM_AAAA_ANTERIOR_TEXTO}'} se procesan automáticamente en TusFacturas</p>
            <p>🔄 Los templates se actualizan automáticamente cada mes desde tus facturas anteriores</p>
          </div>
        </div>

        {/* Modal de confirmación */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Confirmar Envío</h3>
              
              <div className="mb-6 space-y-3">
                <p className="text-gray-600">
                  Estás a punto de enviar <span className="font-bold text-blue-600">{selectedCount} facturas</span>
                </p>
                <p className="text-gray-600">
                  Total: <span className="font-bold font-mono text-green-600">
                    ${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </p>
                
                <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                  <p className="text-yellow-800 text-sm font-medium">⚠️ Importante:</p>
                  <p className="text-yellow-700 text-xs mt-1">
                    Las facturas se enviarán a ARCA para procesamiento. Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmSend}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Sí, Enviar Facturas
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TusFacturasApp;