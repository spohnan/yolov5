import os
from itertools import product
import rasterio as rio
from rasterio import windows

input_filename = "/Users/spohna/Desktop/w/ftx-05/Back-Creek-Road-6-7-2022-all/odm_orthophoto/odm_orthophoto.tif"
out_path = "/Users/spohna/Desktop/tiles/"
output_filename = 'tile_{}-{}.tif'
size = 1024

def get_tiles(ds, width=size, height=size):
    nols, nrows = ds.meta['width'], ds.meta['height']
    offsets = product(range(0, nols, width), range(0, nrows, height))
    big_window = windows.Window(col_off=0, row_off=0, width=nols, height=nrows)
    for col_off, row_off in  offsets:
        window = windows.Window(col_off=col_off, row_off=row_off, width=width, height=height).intersection(big_window)
        transform = windows.transform(window, ds.transform)
        yield window, transform

with rio.open(input_filename) as inds:
    tile_width, tile_height = size, size
    meta = inds.meta.copy()
    for window, transform in get_tiles(inds):
        print(window)
        meta['transform'] = transform
        meta['width'], meta['height'] = window.width, window.height
        outpath = os.path.join(out_path,output_filename.format(int(window.col_off), int(window.row_off)))
        with rio.open(outpath, 'w', **meta) as outds:
            outds.write(inds.read(window=window))
