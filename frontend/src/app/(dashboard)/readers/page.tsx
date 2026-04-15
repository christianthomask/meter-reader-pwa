"use client";

import { useState, useMemo, useCallback } from "react";
import {
  useReaders,
  useCreateReader,
  useUpdateReader,
  useDeactivateReader,
  getReaderStats,
} from "@/hooks/use-reader-management";
import type { Reader } from "@/types/api";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  UserX,
  ArrowUpDown,
  Eye,
  EyeOff,
} from "lucide-react";

// ---- Form Types ----

interface ReaderFormData {
  name: string;
  email: string;
  phone: string;
}

const emptyForm: ReaderFormData = { name: "", email: "", phone: "" };

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---- Page Component ----

export default function ReadersPage() {
  const { data: readers, isLoading } = useReaders();
  const createReader = useCreateReader();
  const updateReader = useUpdateReader();
  const deactivateReader = useDeactivateReader();

  const [showInactive, setShowInactive] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Dialog state
  const [addEditOpen, setAddEditOpen] = useState(false);
  const [editingReader, setEditingReader] = useState<Reader | null>(null);
  const [formData, setFormData] = useState<ReaderFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<ReaderFormData>>({});

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [readerToDeactivate, setReaderToDeactivate] = useState<Reader | null>(
    null
  );

  // Filter readers based on showInactive
  const filteredReaders = useMemo(() => {
    if (!readers) return [];
    if (showInactive) return readers;
    return readers.filter((r) => r.active);
  }, [readers, showInactive]);

  // Open add dialog
  const handleAddOpen = useCallback(() => {
    setEditingReader(null);
    setFormData(emptyForm);
    setFormErrors({});
    setAddEditOpen(true);
  }, []);

  // Open edit dialog
  const handleEditOpen = useCallback((reader: Reader) => {
    setEditingReader(reader);
    setFormData({
      name: reader.name,
      email: reader.email,
      phone: reader.phone,
    });
    setFormErrors({});
    setAddEditOpen(true);
  }, []);

  // Open deactivate dialog
  const handleDeactivateOpen = useCallback((reader: Reader) => {
    setReaderToDeactivate(reader);
    setDeactivateOpen(true);
  }, []);

  // Form validation
  const validateForm = useCallback((): boolean => {
    const errors: Partial<ReaderFormData> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      errors.email = "Invalid email format";
    }
    if (!formData.phone.trim()) errors.phone = "Phone is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Submit form
  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;

    if (editingReader) {
      updateReader.mutate(
        {
          id: editingReader.id,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
        },
        { onSuccess: () => setAddEditOpen(false) }
      );
    } else {
      createReader.mutate(
        {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
        },
        { onSuccess: () => setAddEditOpen(false) }
      );
    }
  }, [validateForm, editingReader, formData, updateReader, createReader]);

  // Confirm deactivate
  const handleDeactivateConfirm = useCallback(() => {
    if (!readerToDeactivate) return;
    deactivateReader.mutate(readerToDeactivate.id, {
      onSuccess: () => {
        setDeactivateOpen(false);
        setReaderToDeactivate(null);
      },
    });
  }, [readerToDeactivate, deactivateReader]);

  // Table columns
  const columns = useMemo<ColumnDef<Reader>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("name")}</span>
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
      },
      {
        accessorKey: "phone",
        header: "Phone",
      },
      {
        accessorKey: "active",
        header: "Status",
        cell: ({ row }) => {
          const active = row.getValue("active") as boolean;
          return (
            <Badge variant={active ? "default" : "secondary"}>
              {active ? "Active" : "Inactive"}
            </Badge>
          );
        },
      },
      {
        id: "routesAssigned",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Routes Assigned
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        accessorFn: (row) => getReaderStats(row.id).routesAssigned,
        cell: ({ getValue }) => (
          <span className="text-center block">{getValue() as number}</span>
        ),
      },
      {
        id: "totalReadings",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Readings
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        accessorFn: (row) => getReaderStats(row.id).totalReadings,
        cell: ({ getValue }) => (
          <span className="text-center block">
            {(getValue() as number).toLocaleString()}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const reader = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEditOpen(reader)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                {reader.active && (
                  <DropdownMenuItem
                    onClick={() => handleDeactivateOpen(reader)}
                    className="text-destructive focus:text-destructive"
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Deactivate
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [handleEditOpen, handleDeactivateOpen]
  );

  const table = useReactTable({
    data: filteredReaders,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: { pageSize: 25 },
    },
  });

  const isMutating =
    createReader.isPending ||
    updateReader.isPending ||
    deactivateReader.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Readers</h1>
          <p className="text-sm text-muted-foreground">
            Manage all meter readers across cities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Hide Inactive
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Show Inactive
              </>
            )}
          </Button>
          <Button onClick={handleAddOpen}>
            <Plus className="mr-2 h-4 w-4" />
            Add Reader
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No readers found.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {table.getPageCount() > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                {table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                  1}{" "}
                to{" "}
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  filteredReaders.length
                )}{" "}
                of {filteredReaders.length} readers
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Reader Dialog */}
      <Dialog open={addEditOpen} onOpenChange={setAddEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingReader ? "Edit Reader" : "Add Reader"}
            </DialogTitle>
            <DialogDescription>
              {editingReader
                ? "Update the reader's information below."
                : "Enter the new reader's information below."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reader-name">Full Name</Label>
              <Input
                id="reader-name"
                placeholder="e.g. John Smith"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reader-email">Email</Label>
              <Input
                id="reader-email"
                type="email"
                placeholder="e.g. john.smith@acs-meters.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
              {formErrors.email && (
                <p className="text-sm text-destructive">{formErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reader-phone">Phone</Label>
              <Input
                id="reader-phone"
                placeholder="e.g. (805) 555-0000"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
              {formErrors.phone && (
                <p className="text-sm text-destructive">{formErrors.phone}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddEditOpen(false)}
              disabled={isMutating}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isMutating}>
              {isMutating
                ? "Saving..."
                : editingReader
                ? "Save Changes"
                : "Add Reader"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Reader</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate{" "}
              <span className="font-semibold text-foreground">
                {readerToDeactivate?.name}
              </span>
              ? They will no longer be able to take readings and their route
              assignments will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeactivateOpen(false);
                setReaderToDeactivate(null);
              }}
              disabled={deactivateReader.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivateConfirm}
              disabled={deactivateReader.isPending}
            >
              {deactivateReader.isPending ? "Deactivating..." : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
