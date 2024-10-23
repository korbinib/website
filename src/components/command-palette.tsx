import {
    Combobox,
    ComboboxInput,
    ComboboxOption,
    ComboboxOptions,
    Dialog,
    DialogBackdrop,
    DialogPanel,
} from '@headlessui/react'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { ExclamationCircleIcon, } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react';
import debounce from "lodash/debounce";
import DomPurify from "dompurify";

export default function CommandPalette({ open, setOpen }) {

    const [searchTerm, setSearchTerm] = useState('');
    const [filteredItems, setFilteredItems] = useState([]);
    const [pageFind, setPageFind] = useState<any>();

    useEffect(() => {
        (async () => {
            setPageFind(await import("/pagefind/pagefind.js?url"));
            if (!pageFind) return;
            await pageFind.options({
                ranking: {
                    // Decreasing the pageLength parameter is a
                    // good way to suppress very short pages that
                    // are undesirably ranking higher than
                    // longer pages. (max: 1, min: 0)
                    pageLength: 0.5,
                },
                filters: {
                    exclude: [
                        "/news/index",
                        "/banner"
                    ]
                }
            });
            pageFind.init();
        })();
    }, []);

    const handleSearch = async (e) => {
        const term = e.target.value;
        const results = await (await pageFind.search(term)).results;
        const res = [];
        for (const result of results) {
            const data = await result.data();
            res.push({
                url: data.url,
                title: data.meta?.title,
                image: data.meta?.image,
                excerpt: data.excerpt
            })
        }
        setFilteredItems([...res.filter((r) => !/^\/news\/?$/.test(r.url))])
    };

    return (
        <Dialog
            className="isolate relative z-[999]"
            open={open}
            onClose={() => {
                setOpen(false)
                setSearchTerm('')
            }}
        >
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-gray-500 bg-opacity-25 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
            />
            <div className="fixed inset-0 z-10 w-screen overflow-y-auto p-4 sm:p-6 md:p-20">
                <DialogPanel
                    transition
                    className="mx-auto max-w-xl transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 transition-all data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
                >
                    <Combobox
                        onChange={(url: any) => {
                            if (url) {
                                window.location = url
                            }
                        }}
                    >
                        <div className="relative">
                            <MagnifyingGlassIcon
                                className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400"
                                aria-hidden="true"
                            />
                            <ComboboxInput
                                autoFocus
                                className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                                placeholder="Search..."
                                onChange={debounce(handleSearch, 500)}
                                onBlur={() => setSearchTerm('')}
                            />
                        </div>
                        {filteredItems.length > 0 && (
                            <ComboboxOptions static className="max-h-96 transform-gpu scroll-py-3 overflow-y-auto p-3">
                                {filteredItems.map((item, index) => (
                                    <ComboboxOption
                                        key={`search-result-${index}`}
                                        value={item.url}
                                        className="group flex cursor-default select-none rounded-xl p-3 data-[focus]:bg-gray-100"
                                    >
                                        <div className="ml-4 flex-auto">
                                            <p className="text-base font-medium text-gray-700 group-data-[focus]:text-gray-900">{item.title}</p>
                                            <p className="text-sm mt-1 text-gray-500 group-data-[focus]:text-gray-700"
                                               dangerouslySetInnerHTML={{
                                                   __html: DomPurify.sanitize(item.excerpt)
                                               }}/>
                                        </div>
                                    </ComboboxOption>
                                ))}
                            </ComboboxOptions>
                        )}
                        {searchTerm !== '' && filteredItems.length === 0 && (
                            <div className="px-6 py-14 text-center text-sm sm:px-14">
                                <ExclamationCircleIcon
                                    type="outline"
                                    name="exclamation-circle"
                                    className="mx-auto h-6 w-6 text-gray-400"
                                />
                                <p className="mt-4 font-semibold text-gray-900">No results found</p>
                                <p className="mt-2 text-gray-500">
                                    No results found for this search term. Please try again.
                                </p>
                            </div>
                        )}
                    </Combobox>
                </DialogPanel>
            </div>
        </Dialog>
    )

}
