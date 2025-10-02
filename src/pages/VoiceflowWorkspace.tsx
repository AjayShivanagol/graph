import React, { useEffect, useState } from 'react';
import { Layout as AntdLayout, Drawer, Dropdown } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/voiceflow/Header';
import Sidebar from '../components/voiceflow/Sidebar';
import Canvas from '../components/voiceflow/Canvas';
import PropertiesPanel from '../components/voiceflow/PropertiesPanel';
import IconSidebar from '../components/voiceflow/IconSidebar';
import KnowledgeBase from '../components/knowledge-base/KnowledgeBase';
import { setSelectedNode, addNode, deleteNode } from '../store/slices/workflowSlice';
import styles from './VoiceflowWorkspace.module.scss';

interface VoiceflowWorkspaceProps {
  defaultView?: 'workflow' | 'knowledge';
}

const { Header: AntdHeader, Sider, Content } = AntdLayout;

const VoiceflowWorkspace: React.FC<VoiceflowWorkspaceProps> = ({ defaultView = 'workflow' }) => {
  const { selectedNodeId, nodes } = useAppSelector(state => state.workflow);
  const dispatch = useAppDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [headerName, setHeaderName] = useState<string>('Block');
  const [headerType, setHeaderType] = useState<string>('block');
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedView, setSelectedView] = useState<string>(defaultView);
  
  // Update URL when selectedView changes
  useEffect(() => {
    const viewPath = selectedView === 'workflow' ? '/workflow' : '/knowledge-base';
    if (location.pathname !== viewPath) {
      navigate(viewPath, { replace: true });
    }
  }, [selectedView, navigate, location.pathname]);
  
  // Update selectedView when URL changes
  useEffect(() => {
    const viewFromPath = location.pathname === '/knowledge-base' ? 'knowledge' : 'workflow';
    if (viewFromPath !== selectedView) {
      setSelectedView(viewFromPath);
    }
  }, [location.pathname, selectedView]);
  
  useEffect(() => {
    if (selectedNodeId) {
      const sn = nodes.find(n => n.id === selectedNodeId);
      const type = sn?.type || 'block';
      const typeName = type.charAt(0).toUpperCase() + type.slice(1);
      setHeaderType(type);
      setHeaderName(typeName);
    }
  }, [selectedNodeId, nodes]);

  const headerColor = {
    'start': '#22c55e',
    'message': '#1677ff',
    'condition': '#f59e0b',
    'action': '#a855f7',
    'database': '#ef4444',
    'kb-search': '#94a3b8',
    'email': '#6366f1'
  }[headerType] || '#6b7280';

  const handleDuplicateNode = (nodeId: string) => {
    const orig = nodes.find(n => n.id === nodeId);
    if (!orig) return;
    
    const newId = `${orig.type}-${Date.now()}`;
    const dup = {
      ...orig,
      id: newId,
      position: { 
        x: (orig.position?.x ?? 0) + 48, 
        y: (orig.position?.y ?? 0) + 48 
      },
      data: { ...orig.data, __editingLabel: false },
      selected: false,
      dragging: false
    };
    
    dispatch(addNode(dup));
    setTimeout(() => dispatch(setSelectedNode(newId)), 50);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (!nodeId) return;
    dispatch(deleteNode(nodeId));
  };

  return (
    <AntdLayout className={styles.layout}>
      <IconSidebar onViewChange={setSelectedView} selectedView={selectedView} />
      
      <AntdLayout className={styles.mainLayout}>
        {selectedView === 'workflow' && (
          <AntdHeader className={styles.header}>
            <Header 
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              sidebarOpen={sidebarOpen}
            />
          </AntdHeader>
        )}
        
        <AntdLayout className={styles.contentLayout}>
          {selectedView === 'workflow' && (
            <Sider
              trigger={null}
              collapsible
              collapsed={!sidebarOpen}
              width={280}
              className={styles.sider}
            >
              <Sidebar />
            </Sider>
          )}

          <Content className={styles.content}>
            {selectedView === 'workflow' ? (
              <>
                <Canvas />
                {selectedNodeId && (
                  <div className={styles.propertiesPanelContainer}>
                    <PropertiesPanel 
                      isOpen={!!selectedNodeId} 
                      selectedNodeId={selectedNodeId} 
                    />
                  </div>
                )}
              </>
            ) : selectedView === 'knowledge' ? (
              <KnowledgeBase />
            ) : (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <h3>Coming Soon</h3>
                <p>This feature is under development.</p>
              </div>
            )}
          </Content>
        </AntdLayout>
      </AntdLayout>

      {selectedView === 'workflow' && (
        <Drawer
          title={
            <div className={styles.headerContainer}>
              <div className={styles.titleContainer}>
                <div 
                  className={styles.drawerIconContainer}
                  style={{ '--header-color': headerColor } as React.CSSProperties}
                >
                  {headerName.charAt(0).toUpperCase()}
                </div>
                <span>{headerName}</span>
              </div>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'duplicate',
                      label: (
                        <div className="menu-item">
                          <div className="menu-item__icon">
                            <img src="/src/components/svg/duplicate.svg" alt="Duplicate" width="16" height="16" />
                          </div>
                          <span className="menu-item__label">Duplicate</span>
                        </div>
                      ),
                      onClick: () => selectedNodeId && handleDuplicateNode(selectedNodeId)
                    },
                    {
                      key: 'delete',
                      label: (
                        <div className="menu-item">
                          <div className="menu-item__icon">
                            <img src="/src/components/svg/delete.svg" alt="Delete" width="16" height="16" />
                          </div>
                          <span className="menu-item__label">Delete</span>
                        </div>
                      ),
                      onClick: () => selectedNodeId && handleDeleteNode(selectedNodeId)
                    }
                  ]
                }}
                trigger={['click']}
              >
                <div className={styles.settingsIcon}>
                  <EllipsisOutlined />
                </div>
              </Dropdown>
            </div>
          }
          placement="right"
          width={400}
          open={!!selectedNodeId}
          onClose={() => dispatch(setSelectedNode(null))}
        >
          {selectedNodeId && (
            <PropertiesPanel 
              isOpen={!!selectedNodeId}
              selectedNodeId={selectedNodeId}
            />
          )}
        </Drawer>
      )}
    </AntdLayout>
  );
};

export default VoiceflowWorkspace;
