import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight,
  Check,
  Loader2,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { IconInput } from "@/components/auth/IconInput";
import {
  alertClass,
  fieldInputClass,
  primaryActionClass,
  secondaryActionClass,
} from "@/components/forms/formStyles";
import {
  frequentContacts as initialFrequentContacts,
  lookupRecipient,
} from "@/services/mocks/walletService";
import RecipientCard from "./RecipientCard";

const destinationSchema = z.object({
  destination: z
    .string()
    .trim()
    .min(1, "Ingresá un alias, CVU o CBU.")
    .refine(
      (value) => /^\d{22}$/.test(value) || /^[a-zA-Z0-9.-]{6,20}$/.test(value),
      "El alias tiene de 6 a 20 caracteres; el CVU y el CBU, 22 números.",
    ),
});

function initialsFrom(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function RecipientStep({ account, onConfirm }) {
  const [frequentList, setFrequentList] = useState(initialFrequentContacts);
  const [editingDestination, setEditingDestination] = useState(null);
  const [editName, setEditName] = useState("");
  const [recipient, setRecipient] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(destinationSchema),
    mode: "onTouched",
  });

  async function search(destination) {
    const key = destination.trim().toLowerCase();
    setRecipient(null);
    setError("");
    if (key === account.alias?.toLowerCase() || key === account.cvu) {
      setError("No podés transferirte a tu propia cuenta.");
      return;
    }
    setSearching(true);
    try {
      const found = await lookupRecipient(key);
      if (found) setRecipient(found);
      else setError("No encontramos una cuenta con ese alias, CVU o CBU.");
    } catch (err) {
      setError(
        err?.message || "No encontramos una cuenta con ese alias, CVU o CBU.",
      );
    } finally {
      setSearching(false);
    }
  }

  function handleSelectFrequent(contact) {
    setValue("destination", contact.destination);
    search(contact.destination);
  }

  function handleDeleteContact(e, destination) {
    e.stopPropagation();
    setFrequentList((prev) =>
      prev.filter((c) => c.destination !== destination),
    );
    if (recipient?.destination === destination) {
      setRecipient(null);
    }
  }

  function startEditing(e, contact) {
    e.stopPropagation();
    setEditingDestination(contact.destination);
    setEditName(contact.name);
  }

  function saveEditing(e, destination) {
    e.stopPropagation();
    if (editName.trim()) {
      setFrequentList((prev) =>
        prev.map((c) =>
          c.destination === destination ? { ...c, name: editName.trim() } : c,
        ),
      );
      if (recipient?.destination === destination) {
        setRecipient((prev) => ({ ...prev, name: editName.trim() }));
      }
    }
    setEditingDestination(null);
  }

  function cancelEditing(e) {
    e.stopPropagation();
    setEditingDestination(null);
  }

  return (
    <div className="m-0 flex min-h-0 flex-1 flex-col gap-4 border-0 bg-transparent p-0 animate-page-enter">
      <form
        onSubmit={handleSubmit((values) => search(values.destination))}
        noValidate
        className="m-0 grid max-w-none gap-2 rounded-2xl border border-[#ECE9F5] bg-[#FAF9FE] p-3.5 dark:border-[#261E3D] dark:bg-[#19122C]"
      >
        <label
          htmlFor="destination"
          className="text-xs font-semibold tracking-wider text-[#6E6888] uppercase dark:text-[#9D97B5]"
        >
          Alias, CVU o CBU
        </label>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <input
            id="destination"
            autoComplete="off"
            placeholder="Alias o CVU de 22 dígitos"
            className={`${fieldInputClass} h-11 w-full flex-1 bg-white px-4 dark:bg-[#120D20]`}
            aria-invalid={!!errors.destination}
            {...register("destination")}
          />
          <button
            type="submit"
            disabled={searching}
            className="m-0 inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#5B2EE0] px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#4C1DB8] disabled:opacity-50 sm:w-auto dark:bg-[#5B2EE0] dark:hover:bg-[#6C3BF4]"
          >
            {searching ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="size-4" aria-hidden="true" />
            )}
            <span>Buscar cuenta</span>
          </button>
        </div>
        {errors.destination && (
          <p role="alert" className="m-0 text-xs font-medium text-rose-500">
            {errors.destination.message}
          </p>
        )}
      </form>

      <div aria-live="polite" className="grid gap-2">
        {searching && (
          <p className="m-0 flex items-center gap-2 rounded-xl bg-[#F3F1F9] px-3.5 py-2.5 text-xs font-medium text-[#4C1DB8] dark:bg-[#1E1735] dark:text-[#C4B2FF]">
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            Verificando titularidad en la cámara compensadora…
          </p>
        )}
        {error && (
          <p role="alert" className={alertClass}>
            {error}
          </p>
        )}
        {recipient && (
          <div className="grid gap-3 rounded-[22px] border border-emerald-500/25 bg-gradient-to-br from-emerald-50/70 via-white to-[#F4FBF8] p-3.5 dark:border-emerald-500/25 dark:from-emerald-950/35 dark:via-[#140F24] dark:to-[#0F1F1C] animate-page-enter">
            <RecipientCard recipient={recipient} />
            <button
              type="button"
              onClick={() => onConfirm(recipient)}
              className={`${primaryActionClass} inline-flex items-center justify-center gap-2`}
            >
              Continuar
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      <div
        role="region"
        aria-label="Contactos frecuentes"
        className="m-0 flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden border-0 bg-transparent p-0"
      >
        <div className="flex items-center justify-between">
          <h3 className="m-0 text-xs font-semibold tracking-wider text-[#6E6888] uppercase dark:text-[#9D97B5]">
            Contactos frecuentes
          </h3>
          <span className="rounded-full bg-[#F3F1F9] px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[#4C1DB8] dark:bg-[#1E1735] dark:text-[#FFD54A]">
            {frequentList.length}
          </span>
        </div>

        {frequentList.length === 0 ? (
          <p className="m-0 rounded-2xl border border-dashed border-[#DFD9F0] bg-[#FAF9FE] p-4 text-center text-xs text-[#8C87A3] dark:border-[#2C2247] dark:bg-[#18122B]/60 dark:text-[#9D97B5]">
            No tenés contactos frecuentes guardados.
          </p>
        ) : (
          <ul className="custom-scrollbar m-0 grid w-full min-h-0 flex-1 auto-rows-max grid-cols-1 list-none content-start gap-2 overflow-y-auto p-0">
            {frequentList.map((contact) => {
              const isEditing = editingDestination === contact.destination;
              const isSelected = recipient?.destination === contact.destination;

              return (
                <li
                  key={contact.destination}
                  className={`group relative flex h-15 w-full items-center justify-between gap-3 overflow-hidden rounded-2xl border px-4 py-2.5 transition-all duration-150 ${
                    isSelected
                      ? "border-[#4C1DB8] bg-[#F4F0FD] dark:border-[#FFD54A]/60 dark:bg-[#22193B]"
                      : "border-[#ECE9F5] bg-[#FAF9FE] hover:border-[#4C1DB8]/30 hover:bg-[#F5F2FC] dark:border-[#261E3D] dark:bg-[#19122C] dark:hover:border-[#3D335A] dark:hover:bg-[#21183A]"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute top-2.5 bottom-2.5 left-0 w-1 rounded-r-full transition-transform duration-150 ${
                      isSelected
                        ? "scale-y-100 bg-[#4C1DB8] dark:bg-[#FFD54A]"
                        : "scale-y-0 bg-[#4C1DB8] group-hover:scale-y-100 dark:bg-[#FFD54A]"
                    }`}
                  />

                  {isEditing ? (
                    <div className="flex w-full items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 min-w-0 flex-1 rounded-lg border border-[#5B2EE0] bg-white px-2.5 text-xs text-[#1C1633] focus:outline-none dark:bg-[#140F24] dark:text-[#F4F2FA]"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={(e) => saveEditing(e, contact.destination)}
                        aria-label={`Guardar nombre de ${contact.name}`}
                        className="m-0 grid size-7 place-items-center rounded-lg border-0 bg-emerald-600 p-0 text-white hover:bg-emerald-700"
                      >
                        <Check className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        aria-label="Cancelar edición"
                        className="m-0 grid size-7 place-items-center rounded-lg border-0 bg-[#E2DCF5] p-0 text-[#4A4560] hover:bg-[#D4CCED] dark:bg-[#261E3D] dark:text-[#9D97B5]"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSelectFrequent(contact)}
                        disabled={searching}
                        className="m-0 flex min-w-0 flex-1 items-center gap-3.5 border-0 bg-transparent p-0 text-left disabled:opacity-60"
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#EDE7FC] font-mono text-xs font-bold text-[#4C1DB8] ring-1 ring-inset ring-[#4C1DB8]/15 dark:bg-[#261D42] dark:text-[#FFD54A] dark:ring-[#FFD54A]/25">
                          {initialsFrom(contact.name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-[#1C1633] dark:text-[#F4F2FA]">
                            {contact.name}
                          </span>
                          <span className="block truncate font-mono text-xs text-[#6E6888] dark:text-[#9D97B5]">
                            {contact.destination}
                          </span>
                        </span>
                        {contact.bank && (
                          <span className="hidden shrink-0 rounded-full bg-[#F3F1F9] px-2.5 py-0.5 text-[11px] font-semibold text-[#4C1DB8] sm:inline-block dark:bg-[#241B3E] dark:text-[#C4B2FF]">
                            {contact.bank}
                          </span>
                        )}
                      </button>

                      <div className="flex shrink-0 items-center gap-1 opacity-80 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => startEditing(e, contact)}
                          aria-label="Editar contacto"
                          className="m-0 grid size-8 place-items-center rounded-full border-0 bg-transparent p-0 text-[#8C87A3] hover:bg-[#ECE9F5] hover:text-[#4C1DB8] dark:text-[#9D97B5] dark:hover:bg-[#281F45] dark:hover:text-[#FFD54A]"
                        >
                          <Pencil className="size-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) =>
                            handleDeleteContact(e, contact.destination)
                          }
                          aria-label="Eliminar contacto"
                          className="m-0 grid size-8 place-items-center rounded-full border-0 bg-transparent p-0 text-[#8C87A3] hover:bg-rose-100 hover:text-rose-600 dark:text-[#9D97B5] dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
