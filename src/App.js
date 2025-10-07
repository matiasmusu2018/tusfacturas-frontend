import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Send, Check, Loader2, AlertCircle, CheckCircle, RefreshCw, Building2, LogOut, UserPlus } from 'lucide-react';

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
  const [addingClient, setAddingClient] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('checking');

  // Verificar sesión guardada
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('tusfacturas_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      testConnection();
    } else {
      setLoading(false);
    }
  }, []);

  // 🔐 Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    await new Promise(resolve => setTimeout(resolve, 500));

    if (loginForm.username === 'Monica' && loginForm.password === 'Nacho2025!') {
      sessionStorage.setItem('tusfacturas_auth', 'true');
      setIsAuthenticated(true);
      testConnection();
    } else {
      setLoginError('Usuario o contraseña incorrectos');
    }

    setIsLoggingIn(false);
  };

  // 🚪 Logout
  const handleLogout = () => {
    sessionStorage.removeItem('tusfacturas_auth');
    setIsAuthenticated(false);
    setTemplates([]);
    setClientes([]);
    setLoginForm({ username: '', password: '' });
  };

  // 🔌 Test de conexión
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
      setLoading(false);
    }
  };

  // 📥 Cargar datos
  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Cargando datos...');
      
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
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // 💾 Guardar templates
  const guardarTemplates = async (templatesActualizados) => {
    try {
      await fetch(`${API_BASE_URL}/api/templates/guardar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates: templatesActualizados })
      });
      console.log('💾 Templates guardados');
    } catch (err) {
      console.error('Error guardando templates:', err);
    }
  };

  // 💾 Guardar clientes
  const guardarClientes = async (clientesActualizados) => {
    try {
      await fetch(`${API_BASE_URL}/api/clientes/guardar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientes: clientesActualizados })
      });
      console.log('💾 Clientes guardados');
    } catch (err) {
      console.error('Error guardando clientes:', err);
    }
  };

  // ➕ Agregar cliente
  const handleAddClient = async () => {
    if (!newClient.nombre || !newClient.documento) {
      alert('Por favor completá nombre y CUIT/DNI');
      return;
    }

    setAddingClient(true);
    setError(null);

    try {
      console.log('➕ Agregando cliente:', newClient.nombre);
      
      const response = await fetch(`${API_BASE_URL}/api/clientes/agregar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente: newClient })
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Cliente agregado:', result.cliente);
        
        // Agregar a la lista local
        const clientesActualizados = [...clientes, result.cliente];
        setClientes(clientesActualizados);
        guardarClientes(clientesActualizados);
        
        // Cerrar modal y limpiar
        setShowAddClientModal(false);
        setNewClient({ nombre: '', email: '', documento: '' });
        
        setSuccess({
          exitosas: 1,
          total: 1,
          fallidas: 0,
          modoPrueba: false
        });
        
        setTimeout(() => setSuccess(null), 3000);
        
      } else {
        throw new Error(result.error || 'Error al agregar cliente');
      }

    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
    } finally {
      setAddingClient(false);
    }
  };

  // ✏️ Editar template - CORREGIDO para no perder focus
  const handleEdit = (id, field, value) => {
    const updatedTemplates = templates.map(t => 
      t.id === id ? { ...t, [field]: field === 'clienteId' ? parseInt(value) : value } : t
    );
    setTemplates(updatedTemplates);
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
    if (clientes.length === 0) {
      alert('Primero agregá un cliente');
      setShowAddClientModal(true);
      return;
    }

    const newId = Math.max(...templates.map(t => t.id), 0) + 1;
    const newTemplate = {
      id: newId,
      clienteId: clientes[0].id,
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

  // 📤 Enviar facturas
  const confirmSend = async () => {
    setShowConfirmation(false);
    setSending(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('🚀 Enviando facturas...');
      
      const response = await fetch(`${API_BASE_URL}/api/enviar-facturas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates: templates.filter(t => t.selected) })
      });
      
      if (!response.ok) throw new Error('Error al enviar facturas');
      
      const result = await response.json();
      console.log('✅ Resultado:', result);
      
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
      console.error('❌ Error:', err);
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
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
                    title="Sincronizar"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </h1>
                <div className="text-gray-600 text-sm space-y-1">
                  <p className="font-medium">SILVIA MONICA NAHABETIAN</p>
                  <p>CUIT: 27233141246 • PDV: 00006 • {clientes.length} clientes • {templates.length} templates</p>
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
                onClick={() => setShowAddClientModal(true)}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Agregar Cliente
              </button>
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

          {/* Mensajes */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                <CheckCircle className="w-5 h-5" />
                ¡Operación exitosa!
              </div>
              <p className="text-green-600 text-sm">
                {success.exitosas} de {success.total} procesadas correctamente
              </p>
            </div>
          )}

          {/* Alerta si no hay clientes */}
          {clientes.length === 0 && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-700 font-medium mb-2">
                <AlertCircle className="w-5 h-5" />
                No hay clientes cargados
              </div>
              <p className="text-yellow-600 text-sm mb-3">
                Para poder agregar templates, primero necesitás cargar tus clientes
              </p>
              <button
                onClick={() => setShowAddClientModal(true)}
                className="flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm"
              >
                <UserPlus className="w-4 h-4" />
                Agregar tu primer cliente
              </button>
            </div>
          )}

          {/* Lista de templates */}
          {templates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No hay templates cargados</p>
              <p className="text-sm">
                {clientes.length > 0 
                  ? 'Hacé click en "Agregar Template" para crear uno'
                  : 'Primero agregá clientes, luego podrás crear templates'
                }
              </p>
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
                          onChange={(e) => {
                            handleEdit(template.id, 'clienteId', e.target.value);
                            setEditingField(null);
                          }}
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
          {templates.length > 0 && (
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
          )}

          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <p>💡 <strong>Tip:</strong> Hacé click en cualquier campo para editarlo</p>
            <p>🏷️ Los tags como {'{MM_AAAA_ANTERIOR_TEXTO}'} se procesan automáticamente</p>
          </div>
        </div>

        {/* Modal agregar cliente */}
        {showAddClientModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Agregar Nuevo Cliente</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre / Razón Social *
                  </label>
                  <input
                    type="text"
                    value={newClient.nombre}
                    onChange={(e) => setNewClient({ ...newClient, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Empresa ABC S.A."
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CUIT / DNI *
                  </label>
                  <input
                    type="text"
                    value={newClient.documento}
                    onChange={(e) => setNewClient({ ...newClient, documento: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: 30123456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (opcional)
                  </label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: contacto@empresa.com"
                  />
                </div>

                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="text-blue-800 text-xs">
                    ℹ️ Si el cliente ya existe en TusFacturas, se asociará automáticamente. Si no existe, se creará nuevo.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddClientModal(false);
                    setNewClient({ nombre: '', email: '', documento: '' });
                  }}
                  disabled={addingClient}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddClient}
                  disabled={addingClient || !newClient.nombre || !newClient.documento}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {addingClient ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Agregando...
                    </>
                  ) : (
                    'Agregar Cliente'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

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