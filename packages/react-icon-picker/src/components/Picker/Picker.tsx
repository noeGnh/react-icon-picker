import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { FixedSizeGrid as Grid } from 'react-window'
import uniqBy from 'lodash.uniqby'
import { getIconFromCache } from '../../cache'
import type { Icon, IconLibrary, IconPickerProps } from '../../types'
import { isSVG, useIconsLoader } from '../../utils'
import { Icon as ItemIcon } from '../Icon'
import './Picker.module.css'

const Picker: React.FC<IconPickerProps> = ({
  value,
  onChange,
  searchPlaceholder = 'Search',
  placeholder,
  multiple = false,
  iconLibrary = 'fa',
  selectedIconBgColor = '#d3d3d3',
  selectedIconColor = '#000000',
  displaySearch = true,
  multipleLimit = Infinity,
  disabled = false,
  selectedItemsToDisplay = 9,
  clearable = false,
  valueType = 'svg',
  includeIcons = [],
  excludeIcons = [],
  includeSearch,
  excludeSearch,
  emptyText = 'Nothing to show',
  inputSize = 'medium',
  theme = 'light',
  emptySlot,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [open, setOpen] = useState<boolean>(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [scrollerWidth, setScrollerWidth] = useState(0)

  const { iconsList, prepareData } = useIconsLoader()

  // Load icons on mount
  useEffect(() => {
    prepareData()
  }, [])

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  // Measure scroller width
  useEffect(() => {
    if (scrollerRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setScrollerWidth(entry.contentRect.width)
        }
      })

      observer.observe(scrollerRef.current)
      return () => observer.disconnect()
    }
  }, [open])

  const filteredIcons = useMemo(() => {
    return uniqBy(
      uniqBy(
        iconsList.filter((icon) => {
          const belongsToIconLibs =
            (typeof iconLibrary === 'string' && icon.library === iconLibrary) ||
            (Array.isArray(iconLibrary) &&
              iconLibrary.includes(icon.library as IconLibrary)) ||
            iconLibrary === 'all'

          const belongsToUserSearch =
            !searchQuery ||
            icon.name?.toLowerCase().includes(searchQuery.toLowerCase())

          const belongsToIncludes =
            !includeIcons || !includeIcons.length || includeIcons.includes(icon.name)

          const belongsToIncludeSearch =
            !includeSearch || icon.name?.toLowerCase().includes(includeSearch.toLowerCase())

          const doesNotBelongsToExcludes =
            !excludeIcons || !excludeIcons.length || !excludeIcons.includes(icon.name)

          const doesNotBelongsToExcludeSearch =
            !excludeSearch || !icon.name?.toLowerCase().includes(excludeSearch.toLowerCase())

          return (
            belongsToIconLibs &&
            belongsToUserSearch &&
            belongsToIncludes &&
            belongsToIncludeSearch &&
            doesNotBelongsToExcludes &&
            doesNotBelongsToExcludeSearch
          )
        }),
        'svgUrl'
      ),
      'name'
    )
  }, [
    iconsList,
    iconLibrary,
    searchQuery,
    includeIcons,
    excludeIcons,
    includeSearch,
    excludeSearch,
  ])

  const getValue = useCallback(
    (icon: Icon) => {
      return valueType === 'name' ? icon.name : getIconFromCache(icon.name)
    },
    [valueType]
  )

  const getSvgCodeOrUrl = useCallback(
    (val: string) => {
      return valueType === 'name' && !isSVG(val)
        ? iconsList?.find((icon) => icon.name === val)?.svgUrl || ''
        : val
    },
    [valueType, iconsList]
  )

  const isIconSelected = useCallback(
    (icon: Icon) => {
      if (multiple) {
        if (value && Array.isArray(value) && value.length) {
          return value.findIndex((i: string) => i === getValue(icon)) > -1
        }
        return false
      } else {
        if (!value) return false
        return value === getValue(icon)
      }
    },
    [multiple, value, getValue]
  )

  const onSelected = useCallback(
    (icon: Icon | undefined) => {
      if (icon) {
        if (multiple) {
          if (value && Array.isArray(value) && value.length) {
            const tempArray = [...value] as string[]
            const index = value.findIndex((i: string) => i === getValue(icon))

            if (index > -1) {
              tempArray.splice(index, 1)
            } else {
              if (value.length < multipleLimit) {
                const iconValue = getValue(icon)
                if (typeof iconValue !== 'undefined') {
                  tempArray.push(iconValue as string)
                }
              }
            }
            onChange(tempArray)
          } else {
            if (multipleLimit > 0) {
              onChange([getValue(icon)] as string[])
            }
          }
        } else {
          if (getValue(icon) === value) {
            if (clearable) onChange(null)
          } else {
            onChange(getValue(icon) as string)
          }
        }
      }
    },
    [multiple, value, onChange, getValue, multipleLimit, clearable]
  )

  const handleToggle = () => {
    if (!disabled) {
      setOpen(!open)
    }
  }

  // Virtual grid settings
  const columnCount = 4
  const columnWidth = scrollerWidth / columnCount || 50
  const rowHeight = 40
  const rowCount = Math.ceil(filteredIcons.length / columnCount)

  const Cell = ({ columnIndex, rowIndex, style }: any) => {
    const index = rowIndex * columnCount + columnIndex
    if (index >= filteredIcons.length) return null

    const item = filteredIcons[index]!

    return (
      <div
        style={style}
        className={`v3ip__grid-item ${isIconSelected(item) ? 'active' : ''}`}
        onClick={() => onSelected(item)}>
        <ItemIcon
          data={item.svgUrl}
          size={24}
          color={
            isIconSelected(item)
              ? selectedIconColor
              : theme === 'dark'
                ? '#e5e7eb'
                : '#222'
          }
        />
      </div>
    )
  }

  return (
    <div
      ref={pickerRef}
      className={`v3ip__custom-select v3ip__${inputSize} v3ip__${theme}`}
      style={
        {
          '--selected-icon-bg-color': selectedIconBgColor,
        } as React.CSSProperties
      }>
      <div
        className={`v3ip__selected ${open ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={handleToggle}>
        {((!multiple && value) || (multiple && Array.isArray(value) && value.length)) ? (
          <>
            {multiple ? (
              <div className="multiple">
                {Array.isArray(value) &&
                  value.map((val, i) => (
                    <React.Fragment key={i}>
                      {i < selectedItemsToDisplay && (
                        <div className="item">
                          <ItemIcon
                            data={getSvgCodeOrUrl(val)}
                            size={20}
                            color={theme === 'dark' ? '#e5e7eb' : '#222'}
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation()
                              onSelected(
                                iconsList?.find((icon: Icon) => getValue(icon) === val)
                              )
                            }}
                          />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                {Array.isArray(value) && value.length > selectedItemsToDisplay && (
                  <div className="item">
                    <b>+{value.length - selectedItemsToDisplay}</b>
                  </div>
                )}
              </div>
            ) : (
              <ItemIcon
                data={getSvgCodeOrUrl(value as string)}
                size={20}
                color={theme === 'dark' ? '#e5e7eb' : '#222'}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  onSelected(iconsList?.find((icon: Icon) => getValue(icon) === value))
                }}
              />
            )}
          </>
        ) : (
          <span className="placeholder">{placeholder}</span>
        )}
      </div>

      <div className={`v3ip__dropdown ${open ? 'v3ip__dropdown--open' : ''}`}>
        {displaySearch && (
          <div className="v3ip__search">
            <input
              type="text"
              name="search"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        {filteredIcons && filteredIcons.length ? (
          <div ref={scrollerRef} className="v3ip__items">
            {scrollerWidth > 0 && (
              <Grid
                columnCount={columnCount}
                columnWidth={columnWidth}
                height={Math.min(225, rowCount * rowHeight)}
                rowCount={rowCount}
                rowHeight={rowHeight}
                width={scrollerWidth}>
                {Cell}
              </Grid>
            )}
          </div>
        ) : (
          <div className="v3ip__empty">
            {emptySlot || (
              <div className="default-text">
                <small>{emptyText}</small>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Picker