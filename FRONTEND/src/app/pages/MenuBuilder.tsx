import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Edit2,
  ListOrdered,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import {
  useBotMenus,
  useCreateBotMenu,
  useCreateBotMenuItem,
  useDeleteBotMenu,
  useDeleteBotMenuItem,
  useReorderBotMenuItems,
  useUpdateBotMenu,
  useUpdateBotMenuItem,
} from "../hooks/useBotMenus";
import { useForms } from "../hooks/useForms";

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]";

const defaultMenuForm = {
  name: "Main Menu",
  title: "Selamat datang di Company Site 👋",
  bodyText: "Silakan pilih layanan berikut:",
  unknownText:
    "Maaf, saya belum memahami pesan tersebut.\nSilakan pilih layanan berikut:",
  footerText: "Balas dengan angka pilihan atau ketik pertanyaan Anda.",
  isActive: true,
  isDefault: true,
};

const defaultItemForm = {
  id: null as number | null,
  number: "",
  title: "",
  description: "",
  actionType: "trigger",
  triggerValue: "",
  formId: "",
  responseText: "",
  isActive: true,
};

const getMenuItems = (menu: any) =>
  [...(menu?.items || [])].sort(
    (a, b) =>
      Number(a.sort_order || 0) - Number(b.sort_order || 0) ||
      Number(a.id || 0) - Number(b.id || 0),
  );

const buildPreview = (
  form: typeof defaultMenuForm,
  items: any[],
  mode: "welcome" | "unknown",
) => {
  const header =
    mode === "unknown"
      ? form.unknownText
      : [form.title, form.bodyText].filter(Boolean).join("\n\n");
  const itemLines = items
    .filter((item) => item.is_active !== false)
    .map(
      (item) =>
        `${item.number}. ${item.title}${item.description ? ` - ${item.description}` : ""}`,
    )
    .join("\n");
  return [header, itemLines, form.footerText].filter(Boolean).join("\n\n");
};

export function MenuBuilder() {
  const menusQuery = useBotMenus();
  const formsQuery = useForms({ page: 1, limit: 100, status: "active" });
  const createMenu = useCreateBotMenu();
  const updateMenu = useUpdateBotMenu();
  const deleteMenu = useDeleteBotMenu();
  const createItem = useCreateBotMenuItem();
  const updateItem = useUpdateBotMenuItem();
  const deleteItem = useDeleteBotMenuItem();
  const reorderItems = useReorderBotMenuItems();
  const menus = menusQuery.data || [];
  const activeForms = formsQuery.data?.rows || [];
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selectedMenu = useMemo(
    () =>
      menus.find((menu: any) => Number(menu.id) === Number(selectedId)) ||
      menus[0],
    [menus, selectedId],
  );
  const [menuForm, setMenuForm] = useState(defaultMenuForm);
  const [itemForm, setItemForm] = useState(defaultItemForm);
  const [formError, setFormError] = useState("");
  const items = getMenuItems(selectedMenu);

  useEffect(() => {
    if (!selectedMenu) return;
    setSelectedId(Number(selectedMenu.id));
    setMenuForm({
      name: selectedMenu.name || "",
      title: selectedMenu.title || "",
      bodyText: selectedMenu.body_text || "",
      unknownText: selectedMenu.unknown_text || "",
      footerText: selectedMenu.footer_text || "",
      isActive: selectedMenu.is_active !== false,
      isDefault: Boolean(selectedMenu.is_default),
    });
    setItemForm(defaultItemForm);
  }, [selectedMenu?.id]);

  const submitMenu = (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    if (
      !menuForm.name.trim() ||
      !menuForm.title.trim() ||
      !menuForm.bodyText.trim() ||
      !menuForm.unknownText.trim()
    ) {
      setFormError(
        "Menu name, title, body text, and unknown text are required.",
      );
      return;
    }
    const payload = { ...menuForm };
    if (selectedMenu) {
      updateMenu.mutate({ menuId: selectedMenu.id, payload });
    } else {
      createMenu.mutate(payload, {
        onSuccess: (menu: any) => setSelectedId(Number(menu.id)),
      });
    }
  };

  const newMenu = () => {
    setSelectedId(null);
    setMenuForm(defaultMenuForm);
    setItemForm(defaultItemForm);
  };

  const editItem = (item: any) => {
    setItemForm({
      id: Number(item.id),
      number: item.number || "",
      title: item.title || "",
      description: item.description || "",
      actionType: item.action_type || "trigger",
      triggerValue: item.trigger_value || "",
      formId: item.form_id ? String(item.form_id) : "",
      responseText: item.response_text || "",
      isActive: item.is_active !== false,
    });
  };

  const submitItem = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedMenu) return;
    setFormError("");
    if (!itemForm.number.trim() || !itemForm.title.trim()) {
      setFormError("Item number and title are required.");
      return;
    }
    if (itemForm.actionType === "trigger" && !itemForm.triggerValue.trim()) {
      setFormError("Trigger value is required.");
      return;
    }
    if (itemForm.actionType === "form" && !itemForm.formId) {
      setFormError("Please select an active form.");
      return;
    }
    if (itemForm.actionType === "text" && !itemForm.responseText.trim()) {
      setFormError("Response text is required.");
      return;
    }

    const payload = {
      number: itemForm.number,
      title: itemForm.title,
      description: itemForm.description || null,
      actionType: itemForm.actionType,
      triggerValue:
        itemForm.actionType === "trigger" ? itemForm.triggerValue : null,
      formId: itemForm.actionType === "form" ? Number(itemForm.formId) : null,
      responseText: ["text", "ai"].includes(itemForm.actionType)
        ? itemForm.responseText
        : null,
      isActive: itemForm.isActive,
    };

    if (itemForm.id) {
      updateItem.mutate(
        { menuId: selectedMenu.id, itemId: itemForm.id, payload },
        { onSuccess: () => setItemForm(defaultItemForm) },
      );
    } else {
      createItem.mutate(
        { menuId: selectedMenu.id, payload },
        { onSuccess: () => setItemForm(defaultItemForm) },
      );
    }
  };

  const moveItem = (itemId: number, direction: -1 | 1) => {
    if (!selectedMenu) return;
    const ids = items.map((item: any) => Number(item.id));
    const index = ids.indexOf(Number(itemId));
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ids.length) return;
    const next = [...ids];
    [next[index], next[target]] = [next[target], next[index]];
    reorderItems.mutate({ menuId: selectedMenu.id, items: next });
  };

  const error =
    formError ||
    menusQuery.error?.message ||
    createMenu.error?.message ||
    updateMenu.error?.message ||
    createItem.error?.message ||
    updateItem.error?.message ||
    deleteItem.error?.message ||
    reorderItems.error?.message;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Menu Builder
          </h1>
          <p className="text-gray-600">
            Build numbered WhatsApp menus that route into bot rules, forms, AI,
            or agents.
          </p>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
        <button
          onClick={newMenu}
          className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E]"
        >
          <Plus className="w-4 h-4" />
          New Menu
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-fit">
          <h2 className="font-semibold text-gray-900 mb-3">Menus</h2>
          {menusQuery.isLoading && (
            <p className="text-sm text-gray-500">Loading menus...</p>
          )}
          {!menusQuery.isLoading && menus.length === 0 && (
            <p className="text-sm text-gray-500">No menus yet.</p>
          )}
          <div className="space-y-2">
            {menus.map((menu: any) => (
              <button
                key={menu.id}
                onClick={() => setSelectedId(Number(menu.id))}
                className={`w-full text-left px-3 py-3 rounded-lg border ${Number(selectedMenu?.id) === Number(menu.id) ? "border-[#25D366] bg-green-50" : "border-gray-200 hover:bg-gray-50"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm text-gray-900">
                    {menu.name}
                  </span>
                  {menu.is_default && (
                    <CheckCircle2 className="w-4 h-4 text-[#25D366]" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {menu.is_active ? "Active" : "Inactive"} ·{" "}
                  {menu.items?.length || 0} items
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 space-y-6">
          <form
            onSubmit={submitMenu}
            className="bg-white rounded-xl border border-gray-100 shadow-sm"
          >
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Menu Settings</h2>
              {selectedMenu && (
                <button
                  type="button"
                  onClick={() =>
                    deleteMenu.mutate(selectedMenu.id, {
                      onSuccess: () => setSelectedId(null),
                    })
                  }
                  className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm font-medium text-gray-700">
                Menu Name
                <input
                  className={`${inputClass} mt-2`}
                  value={menuForm.name}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, name: e.target.value })
                  }
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Title
                <input
                  className={`${inputClass} mt-2`}
                  value={menuForm.title}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, title: e.target.value })
                  }
                />
              </label>
              <label className="md:col-span-2 text-sm font-medium text-gray-700">
                Body Text
                <textarea
                  rows={3}
                  className={`${inputClass} mt-2`}
                  value={menuForm.bodyText}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, bodyText: e.target.value })
                  }
                />
              </label>
              <label className="md:col-span-2 text-sm font-medium text-gray-700">
                Unknown Message Text
                <textarea
                  rows={3}
                  className={`${inputClass} mt-2`}
                  value={menuForm.unknownText}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, unknownText: e.target.value })
                  }
                />
              </label>
              <label className="md:col-span-2 text-sm font-medium text-gray-700">
                Footer Text
                <textarea
                  rows={2}
                  className={`${inputClass} mt-2`}
                  value={menuForm.footerText}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, footerText: e.target.value })
                  }
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={menuForm.isActive}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, isActive: e.target.checked })
                  }
                />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={menuForm.isDefault}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, isDefault: e.target.checked })
                  }
                />
                Default
              </label>
              <button
                type="submit"
                className="md:col-span-2 w-fit flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E]"
              >
                <Save className="w-4 h-4" />
                Save Menu
              </button>
            </div>
          </form>

          {selectedMenu && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="p-5 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Menu Items</h2>
              </div>
              <form
                onSubmit={submitItem}
                className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-200"
              >
                <input
                  placeholder="Number"
                  className={inputClass}
                  value={itemForm.number}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, number: e.target.value })
                  }
                />
                <input
                  placeholder="Title"
                  className={inputClass}
                  value={itemForm.title}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, title: e.target.value })
                  }
                />
                <input
                  placeholder="Description"
                  className={`${inputClass} md:col-span-2`}
                  value={itemForm.description}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, description: e.target.value })
                  }
                />
                <select
                  className={inputClass}
                  value={itemForm.actionType}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, actionType: e.target.value })
                  }
                >
                  <option value="trigger">Trigger</option>
                  <option value="form">Form</option>
                  <option value="text">Text</option>
                  <option value="transfer">Transfer</option>
                  <option value="ai">AI</option>
                </select>
                {itemForm.actionType === "trigger" && (
                  <input
                    placeholder="trigger value"
                    className={inputClass}
                    value={itemForm.triggerValue}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, triggerValue: e.target.value })
                    }
                  />
                )}
                {itemForm.actionType === "form" && (
                  <select
                    className={inputClass}
                    value={itemForm.formId}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, formId: e.target.value })
                    }
                  >
                    <option value="">Select active form</option>
                    {activeForms.map((form: any) => (
                      <option key={form.id} value={form.id}>
                        {form.name}
                      </option>
                    ))}
                  </select>
                )}
                {["text", "ai"].includes(itemForm.actionType) && (
                  <textarea
                    placeholder={
                      itemForm.actionType === "ai"
                        ? "Optional AI instruction/prompt"
                        : "Response text"
                    }
                    rows={3}
                    className={`${inputClass} md:col-span-2`}
                    value={itemForm.responseText}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, responseText: e.target.value })
                    }
                  />
                )}
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={itemForm.isActive}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, isActive: e.target.checked })
                    }
                  />
                  Active
                </label>
                <button
                  type="submit"
                  className="w-fit flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E]"
                >
                  {itemForm.id ? (
                    <Edit2 className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {itemForm.id ? "Update Item" : "Add Item"}
                </button>
              </form>
              <div className="p-5 space-y-2">
                {items.length === 0 && (
                  <p className="text-sm text-gray-500">No menu items yet.</p>
                )}
                {items.map((item: any, index: number) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
                  >
                    <ListOrdered className="w-4 h-4 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900">
                        {item.number}. {item.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.action_type}
                        {item.trigger_value ? ` · ${item.trigger_value}` : ""}
                        {item.form?.name ? ` · ${item.form.name}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => moveItem(item.id, -1)}
                      disabled={index === 0}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveItem(item.id, 1)}
                      disabled={index === items.length - 1}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => editItem(item)}
                      className="p-2 rounded-lg hover:bg-gray-100"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        deleteItem.mutate({
                          menuId: selectedMenu.id,
                          itemId: item.id,
                        })
                      }
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-fit">
          <h2 className="font-semibold text-gray-900 mb-3">Preview</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-800">
            {buildPreview(menuForm, items, "welcome")}
          </div>
          <h3 className="font-semibold text-gray-900 mt-5 mb-3">
            Unknown Preview
          </h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-800">
            {buildPreview(menuForm, items, "unknown")}
          </div>
        </div>
      </div>
    </div>
  );
}
