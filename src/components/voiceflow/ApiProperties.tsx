import React, { useState } from "react";
import {
  Typography,
  Input,
  Select,
  Button,
  Popover,
  Switch,
  Divider,
  Modal,
} from "antd";
import { PlusOutlined, MinusOutlined } from "@ant-design/icons";
import VariablePicker from "../common/VariablePicker";

interface ApiPropertiesProps {
  selectedNode: any;
  handleUpdateNode: (field: string, value: any) => void;
}

export default function ApiProperties({
  selectedNode,
  handleUpdateNode,
}: ApiPropertiesProps) {
  const req = (selectedNode.data as any).request || {};

  // Local state for all form fields to prevent focus loss
  const [localState, setLocalState] = useState({
    method: req.method || "GET",
    url: req.url || "",
    bodyMode: req.bodyMode || "json",
    bodyJson: req.bodyJson || "",
    bodyRaw: req.bodyRaw || "",
    headers: req.headers || [{ key: "", value: "" }],
    params: req.params || [{ key: "", value: "" }],
    formData: req.formData || [{ key: "", value: "" }],
    capture: req.capture || {},
    enableFailure: req.enableFailure ?? false,
    failureLabel: req.failureLabel || "Failure",
    auth: req.auth || {
      type: "none",
      bearer: "",
      basic: { user: "", pass: "" },
      apiKey: { in: "header", name: "", key: "" },
    },
  });

  // Inline popover state for add menus
  const [inlineAdd, setInlineAdd] = useState<{
    type: "param" | "header" | "formdata" | "capture" | null;
    key: string;
    value: string;
  }>({ type: null, key: "", value: "" });

  const allowedMethods = [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
    "HEAD",
    "OPTIONS",
  ];

  // Sync local state to Redux
  const syncToRedux = (updates: Partial<typeof localState>) => {
    const next = { ...req, ...updates };
    handleUpdateNode("request", next);
  };

  // Update local state and optionally sync to Redux
  const updateLocal = (
    updates: Partial<typeof localState>,
    shouldSync = false
  ) => {
    setLocalState((prev) => ({ ...prev, ...updates }));
    if (shouldSync) {
      syncToRedux(updates);
    }
  };

  // Sync local state to Redux on node change
  React.useEffect(() => {
    setLocalState({
      method: req.method || "GET",
      url: req.url || "",
      bodyMode: req.bodyMode || "json",
      bodyJson: req.bodyJson || "",
      bodyRaw: req.bodyRaw || "",
      headers: req.headers || [{ key: "", value: "" }],
      params: req.params || [{ key: "", value: "" }],
      formData: req.formData || [{ key: "", value: "" }],
      capture: req.capture || { object: "", variable: "" },
      enableFailure: req.enableFailure ?? false,
      failureLabel: req.failureLabel || "Failure",
      auth: req.auth || {
        type: "none",
        bearer: "",
        basic: { user: "", pass: "" },
        apiKey: { in: "header", name: "", key: "" },
      },
    });
  }, [selectedNode.id]);

  const isNonGet = () => {
    return localState.method.toUpperCase() !== "GET";
  };

  // URL validation helper
  const validateUrl = (url: string): { isValid: boolean; message?: string } => {
    if (!url || !url.trim()) {
      return { isValid: false, message: "URL is required" };
    }

    const trimmed = url.trim();

    // Must start with https://
    if (!trimmed.startsWith("https://")) {
      return { isValid: false, message: "URL must start with https://" };
    }

    // Basic URL format validation
    try {
      new URL(trimmed);
      return { isValid: true };
    } catch {
      return { isValid: false, message: "Invalid URL format" };
    }
  };

  const urlValidation = validateUrl(localState.url);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Method */}
      <div>
        <Typography.Text
          style={{
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 8,
            display: "block",
          }}
        >
          Method
        </Typography.Text>
        <Select
          value={localState.method}
          onChange={(value) => {
            const m = value.toUpperCase();
            if (m === "GET") {
              updateLocal(
                { method: m, bodyMode: "none", bodyJson: "", bodyRaw: "" },
                true
              );
            } else {
              const bm =
                localState.bodyMode !== "none" ? localState.bodyMode : "json";
              updateLocal({ method: m, bodyMode: bm }, true);
            }
          }}
          options={allowedMethods.map((m) => ({ label: m, value: m }))}
          style={{ width: "100%" }}
        />
      </div>

      {/* URL */}
      <div>
        <Typography.Text
          style={{
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 8,
            display: "block",
          }}
        >
          Request URL
        </Typography.Text>
        <Input
          value={localState.url}
          onChange={(e) => updateLocal({ url: e.target.value })}
          onBlur={(e) => {
            const raw = (e.target.value || "").trim();
            let fixed = raw
              .replace(/^https\s*:\s*\/\//i, "https://")
              .replace(/^https\/:\/\//i, "https://")
              .replace(/^https:\/\/+/, "https://")
              .replace(/^http:\/\/+/, "http://");
            if (/^http:\/\//i.test(fixed)) {
              fixed = fixed.replace(/^http:\/\//i, "https://");
            }
            fixed = fixed.replace(/\s+/g, "");
            updateLocal({ url: fixed }, true);
          }}
          onPressEnter={(e) => {
            const raw = (e.currentTarget.value || "").trim();
            let fixed = raw
              .replace(/^https\s*:\s*\/\//i, "https://")
              .replace(/^https\/:\/\//i, "https://")
              .replace(/^https:\/\/+/, "https://")
              .replace(/^http:\/\/+/, "http://");
            if (/^http:\/\//i.test(fixed)) {
              fixed = fixed.replace(/^http:\/\//i, "https://");
            }
            fixed = fixed.replace(/\s+/g, "");
            updateLocal({ url: fixed }, true);
          }}
          status={!urlValidation.isValid ? "error" : undefined}
          placeholder="https://api.example.com"
          maxLength={2048}
          style={{ width: "100%" }}
        />
        {!urlValidation.isValid && urlValidation.message && (
          <div style={{ color: "#ff4d4f", fontSize: 12, marginTop: 4 }}>
            {urlValidation.message}
          </div>
        )}
      </div>

      {/* Body section only for non-GET methods */}
      {isNonGet() && (
        <>
          <div>
            <Typography.Text
              style={{
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 8,
                display: "block",
              }}
            >
              Body Mode
            </Typography.Text>
            <Select
              value={localState.bodyMode}
              onChange={(value) => {
                if (value === "json") {
                  updateLocal({ bodyMode: "json", bodyRaw: "" }, true);
                } else if (value === "raw") {
                  updateLocal({ bodyMode: "raw", bodyJson: "" }, true);
                } else {
                  updateLocal(
                    { bodyMode: "none", bodyJson: "", bodyRaw: "" },
                    true
                  );
                }
              }}
              options={[
                { label: "JSON", value: "json" },
                { label: "Raw", value: "raw" },
                { label: "Form Data", value: "formdata" },
              ]}
              style={{ width: "100%" }}
            />
          </div>

          {/* JSON Body */}
          {localState.bodyMode === "json" && (
            <div>
              <Typography.Text
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  marginBottom: 8,
                  display: "block",
                }}
              >
                JSON Body
              </Typography.Text>
              <Input.TextArea
                value={localState.bodyJson}
                onChange={(e) => updateLocal({ bodyJson: e.target.value })}
                onBlur={() => syncToRedux({ bodyJson: localState.bodyJson })}
                rows={6}
                placeholder='{"key": "value"}'
              />
            </div>
          )}

          {/* Raw Body */}
          {localState.bodyMode === "raw" && (
            <div>
              <Typography.Text
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  marginBottom: 8,
                  display: "block",
                }}
              >
                Raw Body
              </Typography.Text>
              <Input.TextArea
                value={localState.bodyRaw}
                onChange={(e) => updateLocal({ bodyRaw: e.target.value })}
                onBlur={() => syncToRedux({ bodyRaw: localState.bodyRaw })}
                rows={6}
                placeholder="Raw request body"
              />
            </div>
          )}
        </>
      )}

      {/* Capture Response - Available for all methods */}
      <div style={{ height: 16 }} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography.Text
          style={{ fontSize: 12, color: "#8c8c8c", letterSpacing: 0.3 }}
        >
          Capture Response
        </Typography.Text>
        <Popover
          placement="left"
          trigger="click"
          open={inlineAdd.type === "capture"}
          onOpenChange={(open) =>
            setInlineAdd(
              open
                ? { type: "capture", key: "", value: "" }
                : { type: null, key: "", value: "" }
            )
          }
          content={
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 8,
                width: 260,
              }}
            >
              <Input
                placeholder="Object path (e.g. sss)"
                value={inlineAdd.key}
                onChange={(e) =>
                  setInlineAdd((s) => ({ ...s, key: e.target.value }))
                }
              />
              <VariablePicker
                value={inlineAdd.value}
                onChange={(value) =>
                  setInlineAdd((s) => ({ ...s, value: value || "" }))
                }
                placeholder="Select or create variable"
                size="middle"
                allowCreate
                createMode="modal"
              />
              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
              >
                <Button
                  onClick={() =>
                    setInlineAdd({ type: null, key: "", value: "" })
                  }
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  onClick={() => {
                    const objectPath = inlineAdd.key.trim();
                    const variable = inlineAdd.value.trim();
                    if (!objectPath || !variable) return;
                    // Only allow one capture mapping
                    updateLocal(
                      { capture: { object: objectPath, variable: variable } },
                      true
                    );
                    setInlineAdd({ type: null, key: "", value: "" });
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          }
        >
          <Button size="small" type="text" icon={<PlusOutlined />}>
            Add
          </Button>
        </Popover>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {/* Show single capture mapping */}
        {localState.capture.object && localState.capture.variable && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 12px",
              backgroundColor: "#1677ff",
              borderRadius: 6,
              color: "white",
              fontSize: 14,
            }}
          >
            <span>
              {localState.capture.object} → {localState.capture.variable}
            </span>
            <Button
              type="text"
              size="small"
              icon={<MinusOutlined />}
              style={{ color: "white", marginLeft: "auto" }}
              onClick={() => {
                updateLocal({ capture: { object: "", variable: "" } }, true);
              }}
            />
          </div>
        )}
      </div>

      <Divider style={{ margin: "16px 0" }} />

      {/* Query Parameters */}
      <div>
        <Typography.Text style={{ fontSize: 12, color: "#8c8c8c" }}>
          Query Parameters
        </Typography.Text>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr auto",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <strong>Key</strong>
          <strong>Value</strong>
          <span />
        </div>
        {localState.params.map((item, index) => (
          <div
            key={index}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr auto",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <Input
              value={item.key}
              onChange={(e) => {
                const newParams = [...localState.params];
                newParams[index] = { ...item, key: e.target.value };
                updateLocal({ params: newParams });
              }}
              onBlur={() => syncToRedux({ params: localState.params })}
              placeholder="param"
            />
            <Input
              value={item.value}
              onChange={(e) => {
                const newParams = [...localState.params];
                newParams[index] = { ...item, value: e.target.value };
                updateLocal({ params: newParams });
              }}
              onBlur={() => syncToRedux({ params: localState.params })}
              placeholder="value"
            />
            <Button
              danger
              onClick={() => {
                const newParams = localState.params.filter(
                  (_, i) => i !== index
                );
                updateLocal({ params: newParams }, true);
              }}
            >
              Remove
            </Button>
          </div>
        ))}
        <Popover
          placement="left"
          trigger="click"
          open={inlineAdd.type === "param"}
          onOpenChange={(open) =>
            setInlineAdd(
              open
                ? { type: "param", key: "", value: "" }
                : { type: null, key: "", value: "" }
            )
          }
          content={
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 8,
                width: 260,
              }}
            >
              <Input
                placeholder="param"
                value={inlineAdd.key}
                onChange={(e) =>
                  setInlineAdd((s) => ({ ...s, key: e.target.value }))
                }
              />
              <Input
                placeholder="value"
                value={inlineAdd.value}
                onChange={(e) =>
                  setInlineAdd((s) => ({ ...s, value: e.target.value }))
                }
              />
              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
              >
                <Button
                  onClick={() =>
                    setInlineAdd({ type: null, key: "", value: "" })
                  }
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  onClick={() => {
                    const k = inlineAdd.key.trim();
                    const v = inlineAdd.value.trim();
                    if (!k || !v) return;
                    const newParams = [
                      ...localState.params,
                      { key: k, value: v },
                    ];
                    updateLocal({ params: newParams }, true);
                    setInlineAdd({ type: null, key: "", value: "" });
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          }
        >
          <Button>Add param</Button>
        </Popover>
      </div>

      <Divider style={{ margin: "16px 0" }} />

      {/* Headers */}
      <div>
        <Typography.Text style={{ fontSize: 12, color: "#8c8c8c" }}>
          Headers
        </Typography.Text>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr auto",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <strong>Key</strong>
          <strong>Value</strong>
          <span />
        </div>
        {localState.headers.map((item, index) => (
          <div
            key={index}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr auto",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <Input
              value={item.key}
              onChange={(e) => {
                const newHeaders = [...localState.headers];
                newHeaders[index] = { ...item, key: e.target.value };
                updateLocal({ headers: newHeaders });
              }}
              onBlur={() => syncToRedux({ headers: localState.headers })}
              placeholder="Header-Name"
            />
            <Input
              value={item.value}
              onChange={(e) => {
                const newHeaders = [...localState.headers];
                newHeaders[index] = { ...item, value: e.target.value };
                updateLocal({ headers: newHeaders });
              }}
              onBlur={() => syncToRedux({ headers: localState.headers })}
              placeholder="value"
            />
            <Button
              danger
              onClick={() => {
                const newHeaders = localState.headers.filter(
                  (_, i) => i !== index
                );
                updateLocal({ headers: newHeaders }, true);
              }}
            >
              Remove
            </Button>
          </div>
        ))}
        <Popover
          placement="left"
          trigger="click"
          open={inlineAdd.type === "header"}
          onOpenChange={(open) =>
            setInlineAdd(
              open
                ? { type: "header", key: "", value: "" }
                : { type: null, key: "", value: "" }
            )
          }
          content={
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 8,
                width: 260,
              }}
            >
              <Input
                placeholder="Header-Name"
                value={inlineAdd.key}
                onChange={(e) =>
                  setInlineAdd((s) => ({ ...s, key: e.target.value }))
                }
              />
              <Input
                placeholder="value"
                value={inlineAdd.value}
                onChange={(e) =>
                  setInlineAdd((s) => ({ ...s, value: e.target.value }))
                }
              />
              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
              >
                <Button
                  onClick={() =>
                    setInlineAdd({ type: null, key: "", value: "" })
                  }
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  onClick={() => {
                    const k = inlineAdd.key.trim();
                    const v = inlineAdd.value.trim();
                    if (!k || !v) return;
                    const newHeaders = [
                      ...localState.headers,
                      { key: k, value: v },
                    ];
                    updateLocal({ headers: newHeaders }, true);
                    setInlineAdd({ type: null, key: "", value: "" });
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          }
        >
          <Button>Add header</Button>
        </Popover>
      </div>

      <Divider style={{ margin: "16px 0" }} />

      {/* Authentication */}
      <div>
        <Typography.Text style={{ fontSize: 12, color: "#8c8c8c" }}>
          Authentication
        </Typography.Text>
        <div style={{ marginTop: 8 }}>
          <Typography.Text
            style={{
              fontSize: 14,
              fontWeight: 500,
              marginBottom: 8,
              display: "block",
            }}
          >
            Type
          </Typography.Text>
          <Select
            value={localState.auth.type}
            onChange={(value) => {
              const newAuth = {
                type: value,
                bearer: "",
                basic: { user: "", pass: "" },
                apiKey: { in: "header", name: "", key: "" },
              };
              updateLocal({ auth: newAuth }, true);
            }}
            options={[
              { label: "None", value: "none" },
              { label: "Bearer Token", value: "bearer" },
              { label: "Basic Auth", value: "basic" },
              { label: "API Key", value: "apikey" },
            ]}
            style={{ width: "100%" }}
          />
        </div>

        {/* Bearer Token */}
        {localState.auth.type === "bearer" && (
          <div style={{ marginTop: 12 }}>
            <Typography.Text
              style={{
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 8,
                display: "block",
              }}
            >
              Token
            </Typography.Text>
            <Input.Password
              value={localState.auth.bearer}
              onChange={(e) =>
                updateLocal({
                  auth: { ...localState.auth, bearer: e.target.value },
                })
              }
              onBlur={() => syncToRedux({ auth: localState.auth })}
              placeholder="eyJ..."
              visibilityToggle
            />
          </div>
        )}

        {/* Basic Auth */}
        {localState.auth.type === "basic" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginTop: 12,
            }}
          >
            <div>
              <Typography.Text
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  marginBottom: 8,
                  display: "block",
                }}
              >
                Username
              </Typography.Text>
              <Input
                value={localState.auth.basic.user}
                onChange={(e) =>
                  updateLocal({
                    auth: {
                      ...localState.auth,
                      basic: { ...localState.auth.basic, user: e.target.value },
                    },
                  })
                }
                onBlur={() => syncToRedux({ auth: localState.auth })}
                placeholder="username"
              />
            </div>
            <div>
              <Typography.Text
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  marginBottom: 8,
                  display: "block",
                }}
              >
                Password
              </Typography.Text>
              <Input.Password
                value={localState.auth.basic.pass}
                onChange={(e) =>
                  updateLocal({
                    auth: {
                      ...localState.auth,
                      basic: { ...localState.auth.basic, pass: e.target.value },
                    },
                  })
                }
                onBlur={() => syncToRedux({ auth: localState.auth })}
                placeholder="password"
                visibilityToggle
              />
            </div>
          </div>
        )}

        {/* API Key */}
        {localState.auth.type === "apikey" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 8,
              marginTop: 12,
            }}
          >
            <div>
              <Typography.Text
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  marginBottom: 8,
                  display: "block",
                }}
              >
                In
              </Typography.Text>
              <Select
                value={localState.auth.apiKey.in}
                onChange={(value) =>
                  updateLocal(
                    {
                      auth: {
                        ...localState.auth,
                        apiKey: { ...localState.auth.apiKey, in: value },
                      },
                    },
                    true
                  )
                }
                options={[
                  { label: "Header", value: "header" },
                  { label: "Query", value: "query" },
                ]}
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <Typography.Text
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  marginBottom: 8,
                  display: "block",
                }}
              >
                Name
              </Typography.Text>
              <Input
                value={localState.auth.apiKey.name}
                onChange={(e) =>
                  updateLocal({
                    auth: {
                      ...localState.auth,
                      apiKey: {
                        ...localState.auth.apiKey,
                        name: e.target.value,
                      },
                    },
                  })
                }
                onBlur={() => syncToRedux({ auth: localState.auth })}
                placeholder="Authorization / X-API-KEY / api_key"
              />
            </div>
            <div>
              <Typography.Text
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  marginBottom: 8,
                  display: "block",
                }}
              >
                Key
              </Typography.Text>
              <Input
                value={localState.auth.apiKey.key}
                onChange={(e) =>
                  updateLocal({
                    auth: {
                      ...localState.auth,
                      apiKey: {
                        ...localState.auth.apiKey,
                        key: e.target.value,
                      },
                    },
                  })
                }
                onBlur={() => syncToRedux({ auth: localState.auth })}
                placeholder="your_api_key"
              />
            </div>
          </div>
        )}
      </div>

      <Divider style={{ margin: "16px 0" }} />

      {/* Failure Path */}
      <div>
        <Typography.Text
          style={{ fontSize: 12, color: "#8c8c8c", letterSpacing: 0.3 }}
        >
          Failure Path
        </Typography.Text>
        <div style={{ marginTop: 8 }}>
          <Switch
            checked={localState.enableFailure}
            onChange={(checked) =>
              updateLocal({ enableFailure: checked }, true)
            }
          />
        </div>
        {localState.enableFailure && (
          <div style={{ marginTop: 12 }}>
            <Typography.Text
              style={{
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 8,
                display: "block",
              }}
            >
              Failure label
            </Typography.Text>
            <Input
              value={localState.failureLabel}
              onChange={(e) => updateLocal({ failureLabel: e.target.value })}
              onBlur={() =>
                syncToRedux({ failureLabel: localState.failureLabel })
              }
              placeholder="Failure"
              maxLength={24}
            />
          </div>
        )}
      </div>
    </div>
  );
}
