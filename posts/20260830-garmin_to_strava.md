<!--
Draft status: Initial draft
Suggested slug: garmin-history-to-strava-fit-file-validation
Image placeholders are written as Markdown comments so they can be replaced with images later.
-->

I first joined fun runs in Cebu back in 2010 or 2011, but I only started tracking my runs with a Garmin watch in 2019. Over the years, I accumulated hundreds of activities in a span of eight years, and I wanted to bring them into Strava. Why? Because my friends invited me over recently, and now I realized that Strava has a more active community of runners and cyclists than Garmin Connect.

So the goal sounded simple: export the old activities, upload them, and keep future workouts syncing automatically. In practice, the export contained thousands of files, some were tiny, and a handful of uploads failed with Strava's generic **“processing error.”**

This post documents the workflow I used, the checks I tried, and what I learned. It is a practical account rather than a definitive explanation of every reason Strava might reject a FIT file.

<!-- IMAGE PLACEHOLDER 1
Suggested image: A simple hero graphic showing Garmin Connect → a folder of FIT files → Strava.
Alt text: Moving historical Garmin activity files into Strava.
-->

## 1. Getting the historical files out of Garmin

I requested a full-data export from Garmin. At first, I expected to find ordinary activity files immediately, but the export initially looked like a collection of JSON files.

After inspecting the archive more carefully, I found ZIP files containing around **15,000 FIT files**, along with some GPX files.

That was the key discovery: the data I needed was there, but nested inside the export's folder and ZIP structure.

Here is a link to [exporting data from Garmin Connect](https://support.strava.com/en-us/articles/15402167-exporting-files-from-garmin-connect).

### FIT or GPX?

For this migration, I chose FIT as the primary format, as I found out that FIT files can preserve more activity information than GPX, including sensor data such as heart rate and cadence when those data are present in the original file.
I kept the original Garmin export as a backup rather than treating the extracted files as disposable.

<!-- IMAGE PLACEHOLDER 2
Suggested screenshot: Finder showing the extracted Garmin export and a folder of FIT files. Blur personal information and filenames if necessary.
Alt text: FIT files extracted from Garmin's data export.
-->

## 2. Finding all FIT files in nested folders

With thousands of files, checking folders manually was not realistic. On macOS, the `find` command can list FIT files recursively:

```bash
find /path/to/folder -type f -name "*.fit"
```

To match extensions regardless of capitalization, use:

```bash
find /path/to/folder -type f -iname "*.fit"
```

Replace `/path/to/folder` with the actual folder containing the extracted files.

This only locates the files; it does not tell you whether each one represents a complete activity or whether Strava will accept it.

## 3. Why file size alone wasn't enough

Some FIT files were smaller than 1 KB. That made me wonder whether they were empty or irrelevant.

File size is a useful clue, but not a reliable verdict. A very small file deserves inspection, yet filtering files solely by size could discard something without understanding what it contains. I therefore kept the original archive and looked for a more systematic validation approach.

## 4. First pass: check the FIT container

The first Python script, `validate_fit_files.py`, checked basic structural properties:

- Whether the file was large enough to contain a FIT header.
- Whether the header size was one of the expected sizes.
- Whether the header contained the `.FIT` signature.
- Whether the declared data length was consistent with the file size.
- Whether the file-level CRC-16 matched.

This first pass used Python's standard library, so it did not require an additional package.

I ran it over the collection. The surprising result was that **all the files passed these checks**, even though some still failed when uploaded to Strava.

That result taught me an important distinction: a file can have a structurally valid container and still contain activity data that an importer cannot use or interpret as expected. Header and checksum checks are useful, but they do not establish that a file represents a complete, uploadable workout.

<!-- IMAGE PLACEHOLDER 3
Suggested screenshot: Terminal output from the first validation script, with file paths and personal details obscured.
Alt text: Initial FIT header and checksum validation results.
-->

## 5. Second pass: parse the activity messages

Because the first pass did not explain the upload errors, I explored a deeper parser using Python's `fitparse` library.

Install it with:

```bash
pip3 install fitparse
```

The second script, `deep_validate_fit_files.py`, attempts to decode the messages inside each FIT file. It checks for several signs that a file may be an activity:

- A `file_id` message.
- An activity file type, when the type is specified.
- A `time_created` value.
- `record` messages, which typically contain recorded data points.
- A `session` message, which commonly contains activity summary information.

It also groups files that share the same manufacturer, device serial number, and creation time as **possible duplicates**.

These are practical heuristics, not a guarantee of Strava compatibility. For example, a legitimate activity can have unusual characteristics, and different FIT file types do not all have the same structure. A file that fails one of these checks should be investigated before it is discarded.

The script also supports CSV reporting, which makes it easier to review results in a spreadsheet:

```bash
python3 deep_validate_fit_files.py /path/to/folder --csv report.csv
```

The script includes an option to move files it flags as invalid. I would use that option cautiously: review the report first, and preserve an untouched backup.

<!-- IMAGE PLACEHOLDER 4
Suggested image: A cropped terminal or spreadsheet view showing a validation report with columns such as path, valid, reason, and possible_duplicate.
Alt text: Reviewing detailed FIT parsing results and possible duplicates.
-->

## 6. What the checks can —- and cannot -— tell you

The deeper script was an investigation tool, not a confirmed reproduction of Strava's internal importer. At the time of writing, it had only been smoke-tested with artificial files, not thoroughly validated against a representative set of real Garmin activities and Strava upload outcomes.

Possible explanations for a generic processing error include:

- The file is not an activity file, or lacks expected activity messages.
- The activity is incomplete or has unusual timestamps.
- The file contains malformed or unusual message definitions or developer fields.
- GPS or record data are missing or unusable.
- The activity duplicates one already uploaded.
- A sport or sub-sport value is unusual or unsupported by the importer.

These are hypotheses to investigate, not confirmed causes of the errors I encountered. A useful next step is to compare one FIT file that Strava accepts with one it rejects, using a FIT decoder or dump tool, and inspect their message structures and data. That comparison may narrow down the cause far better than file size or header checks alone.

## 7. Uploading the historical activities to Strava

Once I had identified the activity files, I uploaded the historical data to Strava. Strava's bulk-upload allowance became a meaningful part of the workflow: after I crossed a certain upload threshold, I was offered a **30-day free trial without entering a credit card**. That increased the number of files I could upload per batch from **15 to 25**, which helped speed up the process.
So all in all it took me more than a week to upload the entire archive, but I was able to do it in batches without paying for a subscription.
Here's the link mentioning the [daily upload limit](https://support.strava.com/en-us/articles/15402173-how-do-i-bulk-upload-activities-to-strava).

That was my experience at the time; offers, eligibility, and upload limits can change, so check the current terms shown in your own Strava account rather than assuming the same offer will appear for everyone.

If some recent Garmin activities already sync automatically to Strava, watch for duplicates when importing older files. Keep the original export until you have checked the results in Strava.

<!-- IMAGE PLACEHOLDER 5
Suggested screenshot: Strava's upload interface or a completed upload batch. Hide names, maps, dates, and other personal activity information if you prefer.
Alt text: Uploading historical Garmin FIT files to Strava in batches.
-->

## 8. A practical workflow I would recommend

For a large Garmin archive, my workflow is:

1. **Keep an untouched backup** of the original Garmin export.
2. Extract the nested ZIP files into a working directory.
3. Count and locate the FIT files recursively.
4. Run basic header, length, and CRC checks.
5. Run deeper parsing and export a CSV report.
6. Review suspicious files and possible duplicates rather than deleting them automatically.
7. Upload FIT files in batches, keeping track of what has been uploaded.
8. Investigate any files that Strava rejects by comparing them with accepted files.
9. Check the resulting Strava history for missing activities and duplicates.

For thousands of activities, the CSV report and a clear separation between the original archive, working files, and files ready for upload make the process much easier to manage.

## 9. Takeaways

The biggest lesson was that **“valid FIT file” and “activity Strava can import” are not the same thing**. A header and CRC check can confirm basic file integrity, but they cannot guarantee that the contents form a complete activity that Strava will accept.

I also learned not to treat tiny files as automatically useless, and not to assume that a generic upload error reveals the exact problem. The best approach is to preserve the originals, validate in stages, and investigate failures with evidence.

The historical import is now complete, and the free-trial upload allowance made the batching process faster. The deeper validation script remains a useful starting point, but its heuristics—and the actual cause of any remaining processing errors—need confirmation against real accepted and rejected activities.

